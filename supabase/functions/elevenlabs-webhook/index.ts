import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Always return 200 — ElevenLabs retries on any non-2xx response
  const ok = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return ok();

  // Verify secret from query param
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");
  if (!expectedSecret || secret !== expectedSecret) {
    console.error("elevenlabs-webhook: invalid or missing secret");
    return ok();
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let rawBody = "";
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("elevenlabs-webhook: failed to read body", e);
    return ok();
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("elevenlabs-webhook: failed to parse JSON. Raw (first 500):", rawBody.slice(0, 500));
    return ok();
  }

  console.log("elevenlabs-webhook: payload keys:", Object.keys(payload));

  // webhook_metadata may arrive as a string or parsed object depending on ElevenLabs version
  let meta: Record<string, any> = {};
  if (typeof payload.webhook_metadata === "string") {
    try { meta = JSON.parse(payload.webhook_metadata); } catch { /* leave empty */ }
  } else if (payload.webhook_metadata && typeof payload.webhook_metadata === "object") {
    meta = payload.webhook_metadata;
  }

  const jobId: string | undefined = meta.job_id;
  const sermonId: string | undefined = meta.sermon_id;

  if (!jobId || !sermonId) {
    console.error(
      "elevenlabs-webhook: missing job_id or sermon_id in webhook_metadata. Payload (first 500):",
      JSON.stringify(payload).slice(0, 500)
    );
    return ok();
  }

  // Error payload: has message_type field
  if (payload.message_type) {
    console.error(
      `elevenlabs-webhook: transcription error for job ${jobId}: ${payload.message_type} — ${payload.error}`
    );

    const { data: job } = await supabase
      .from("sermon_jobs")
      .select("attempts, max_attempts")
      .eq("id", jobId)
      .single();

    if (job) {
      const isFinal = job.attempts >= job.max_attempts;
      const update: Record<string, any> = {
        status: isFinal ? "failed" : "retrying",
        error_message: `ElevenLabs transcription error: ${payload.message_type} — ${payload.error || "unknown"}`,
        error_details: null,
        current_stage: null,
        locked_until: null,
        worker_id: null,
      };
      if (isFinal) {
        update.failed_at = new Date().toISOString();
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermonId);
      }
      await supabase.from("sermon_jobs").update(update).eq("id", jobId);
    }

    return ok();
  }

  // Success payload: has text field
  const transcriptText: string = payload.text || "";
  if (!transcriptText) {
    console.error(
      "elevenlabs-webhook: no text in payload. Raw (first 500):",
      rawBody.slice(0, 500)
    );
    await supabase.from("sermon_jobs").update({
      status: "failed",
      error_message: "ElevenLabs webhook: no transcript text in payload",
      error_details: { raw_payload: rawBody.slice(0, 2000) },
      failed_at: new Date().toISOString(),
      current_stage: null,
      locked_until: null,
      worker_id: null,
    }).eq("id", jobId);
    return ok();
  }

  // Build word timings array (filter out audio events like [laughter])
  const wordTimings = (payload.words || [])
    .filter((w: any) => w.type === "word" || !w.type)
    .map((w: any) => ({ text: w.text, start: w.start, end: w.end }));

  // Embed timing markers so the chapters prompt has timestamp grounding when AI runs
  const fullText = embedTimingMarkers(transcriptText, wordTimings);
  const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;

  // Insert transcript — idempotent check handles duplicate webhook deliveries
  const { error: transcriptError } = await supabase
    .from("sermon_transcripts")
    .insert({
      sermon_id: sermonId,
      full_text: fullText,
      word_count: wordCount,
      language: payload.language_code || "en",
    });

  if (transcriptError) {
    const { data: existing } = await supabase
      .from("sermon_transcripts")
      .select("id")
      .eq("sermon_id", sermonId)
      .maybeSingle();

    if (!existing) {
      console.error("elevenlabs-webhook: transcript insert failed:", transcriptError);
      await supabase.from("sermon_jobs").update({
        status: "failed",
        error_message: "Failed to save transcript from webhook",
        error_details: null,
        failed_at: new Date().toISOString(),
        current_stage: null,
        locked_until: null,
        worker_id: null,
      }).eq("id", jobId);
      return ok();
    }
    // Transcript already exists — duplicate delivery, still reset the job below
    console.log(`elevenlabs-webhook: transcript already exists for sermon ${sermonId}, resetting job`);
  }

  // Reset job to queued — the 1-min cron picks it up within 60s for AI generation
  await supabase.from("sermon_jobs").update({
    status: "queued",
    error_message: null,
    error_details: null,
    current_stage: null,
    locked_until: null,
    worker_id: null,
  }).eq("id", jobId);

  console.log(
    `elevenlabs-webhook: transcript saved for sermon ${sermonId} (${wordCount} words), job ${jobId} reset to queued`
  );
  return ok();
});

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function embedTimingMarkers(
  transcript: string,
  wordTimings: { text: string; start: number; end: number }[]
): string {
  if (!wordTimings.length) return transcript;

  const INTERVAL = 60;
  let result = "";
  let lastMarkerTime = -INTERVAL;

  for (const word of wordTimings) {
    const currentTime = word.start;
    if (currentTime - lastMarkerTime >= INTERVAL) {
      result += `[${formatTimestamp(currentTime)}] `;
      lastMarkerTime = currentTime;
    }
    result += word.text + " ";
  }

  return result.trim();
}
