import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const elevenlabsKey = Deno.env.get("ELEVENLABS_API_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Auth check: accept service role key, anon key, or valid user JWT
  const authHeader = req.headers.get("Authorization");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const token = authHeader?.replace("Bearer ", "") || "";
  if (token !== supabaseServiceKey && token !== anonKey) {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    // ─── Check for regeneration request ───
    let reqBody: any = {};
    try {
      reqBody = await req.json();
    } catch {
      // No body — normal job processing
    }

    if (reqBody.regenerate_type && reqBody.sermon_id) {
      return await handleRegeneration(supabase, lovableApiKey, reqBody.sermon_id, reqBody.regenerate_type, reqBody.item_index);
    }

    // ─── Stale job recovery ───
    // Reset any jobs stuck in "processing" past their locked_until
    const { data: staleJobs } = await supabase
      .from("sermon_jobs")
      .select("id, attempts, max_attempts")
      .eq("status", "processing")
      .not("locked_until", "is", null)
      .lt("locked_until", new Date().toISOString());

    if (staleJobs && staleJobs.length > 0) {
      for (const stale of staleJobs) {
        if (stale.attempts >= stale.max_attempts) {
          await supabase
            .from("sermon_jobs")
            .update({
              status: "failed",
              error_message: "Stale job exceeded max attempts",
              failed_at: new Date().toISOString(),
              current_stage: null,
            })
            .eq("id", stale.id);
        } else {
          await supabase
            .from("sermon_jobs")
            .update({
              status: "queued",
              worker_id: null,
              locked_until: null,
              current_stage: null,
              error_message: "Auto-recovered from stale processing state",
            })
            .eq("id", stale.id);
        }
        console.log(`Recovered stale job ${stale.id}`);
      }
    }

    // ─── Normal job queue processing ───
    const workerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const leaseMinutes = 10;
    const leaseUntil = new Date(Date.now() + leaseMinutes * 60 * 1000).toISOString();

    const { data: jobs, error: claimError } = await supabase
      .from("sermon_jobs")
      .select("*")
      .in("status", ["queued", "retrying"])
      .or(`status.eq.queued,and(status.eq.retrying,locked_until.is.null),and(status.eq.retrying,locked_until.lte.${now})`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1);

    if (claimError || !jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs to process" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = jobs[0];
    const isRetry = job.status === "retrying";

    const { data: claimedRows, error: lockError } = await supabase
      .from("sermon_jobs")
      .update({
        status: "processing",
        worker_id: workerId,
        started_at: isRetry ? job.started_at : now,
        attempts: job.attempts + 1,
        locked_until: leaseUntil,
        current_stage: "claiming",
      })
      .eq("id", job.id)
      .in("status", ["queued", "retrying"])
      .select();

    if (lockError || !claimedRows || claimedRows.length === 0) {
      return new Response(JSON.stringify({ message: "Job already claimed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sermon, error: sermonError } = await supabase
      .from("sermons")
      .select("*")
      .eq("id", job.sermon_id)
      .single();

    if (sermonError || !sermon) {
      await failJob(supabase, job.id, "Sermon not found");
      return new Response(JSON.stringify({ error: "Sermon not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to extend the lease before long operations
    const refreshLease = async (stage: string) => {
      const newLease = new Date(Date.now() + leaseMinutes * 60 * 1000).toISOString();
      await supabase
        .from("sermon_jobs")
        .update({ locked_until: newLease, current_stage: stage })
        .eq("id", job.id);
    };

    const { data: existingTranscript } = await supabase
      .from("sermon_transcripts")
      .select("id, full_text")
      .eq("sermon_id", sermon.id)
      .maybeSingle();

    let transcriptText = existingTranscript?.full_text || "";
    let wordTimings: { text: string; start: number; end: number }[] = [];

    if (!existingTranscript) {
      await refreshLease("transcribing");
      await supabase
        .from("sermons")
        .update({ status: "transcribing" })
        .eq("id", sermon.id);

      // ─── Signed URL approach: no file download needed ───
      console.log("Generating signed URL for:", sermon.storage_path);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("sermon-media")
        .createSignedUrl(sermon.storage_path!, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        await failJob(supabase, job.id, "Failed to generate signed URL for media file");
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermon.id);
        return new Response(JSON.stringify({ error: "Signed URL generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Transcribing with ElevenLabs via signed URL...");
      const transcribeForm = new FormData();
      transcribeForm.append("model_id", "scribe_v2");
      transcribeForm.append("cloud_storage_url", signedUrlData.signedUrl);
      transcribeForm.append("tag_audio_events", "false");
      transcribeForm.append("diarize", "false");

      const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "xi-api-key": elevenlabsKey,
        },
        body: transcribeForm,
      });

      if (!transcribeResponse.ok) {
        const errText = await transcribeResponse.text();
        console.error("ElevenLabs error:", transcribeResponse.status, errText);
        await failJob(supabase, job.id, `Transcription failed: ${transcribeResponse.status}`);
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermon.id);
        return new Response(JSON.stringify({ error: "Transcription failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const transcription = await transcribeResponse.json();
      transcriptText = transcription.text || "";
      wordTimings = (transcription.words || []).map((w: any) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      }));

      // Debug: log transcript stats and timing coverage
      const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
      const lastWord = wordTimings.length > 0 ? wordTimings[wordTimings.length - 1] : null;
      const firstWord = wordTimings.length > 0 ? wordTimings[0] : null;
      console.log(`Transcript stats: ${wordCount} words in text, ${wordTimings.length} words with timings`);
      console.log(`Timing range: ${firstWord ? firstWord.start + 's' : 'none'} → ${lastWord ? lastWord.end + 's' : 'none'} (${lastWord ? (lastWord.end / 60).toFixed(1) + ' min' : '0 min'})`);
      console.log(`First 3 timed words:`, JSON.stringify(wordTimings.slice(0, 3)));
      console.log(`Last 3 timed words:`, JSON.stringify(wordTimings.slice(-3)));
      if (wordTimings.length > 0) {
        const withZeroStart = wordTimings.filter((w: any) => w.start === 0 || w.start === undefined || w.start === null).length;
        console.log(`Words with zero/null start time: ${withZeroStart} of ${wordTimings.length}`);
      }

      const { error: transcriptError } = await supabase
        .from("sermon_transcripts")
        .insert({
          sermon_id: sermon.id,
          full_text: transcriptText,
          word_count: wordCount,
          language: "en",
        });

      if (transcriptError) {
        console.error("Transcript save error:", transcriptError);
        await failJob(supabase, job.id, "Failed to save transcript");
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermon.id);
        return new Response(JSON.stringify({ error: "Failed to save transcript" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const transcriptWithTimings = embedTimingMarkers(transcriptText, wordTimings);

    console.log("Generating AI content...");
    await refreshLease("generating");
    await supabase.from("sermons").update({ status: "generating" }).eq("id", sermon.id);

    const { data: existingContent } = await supabase
      .from("sermon_content")
      .select("content_type")
      .eq("sermon_id", sermon.id);

    const existingTypes = new Set((existingContent || []).map((c: any) => c.content_type));

    const allContentTypes = [
      { type: "spark", prompt: buildSparkPrompt(sermon.title, transcriptText) },
      { type: "takeaways", prompt: buildTakeawaysPrompt(sermon.title, transcriptText) },
      { type: "reflection_questions", prompt: buildReflectionPrompt(sermon.title, transcriptText) },
      { type: "scriptures", prompt: buildScripturesPrompt(sermon.title, transcriptText) },
      { type: "chapters", prompt: buildChaptersPrompt(sermon.title, transcriptWithTimings) },
    ];

    const missingTypes = allContentTypes.filter((ct) => !existingTypes.has(ct.type));
    const failedTypes: string[] = [];

    if (missingTypes.length === 0) {
      console.log("All content types already generated");
    }

    // ─── Parallel AI content generation ───
    const results = await Promise.allSettled(
      missingTypes.map(async (ct) => {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a sermon content analyst for a church app. You focus exclusively on spiritual, biblical, and faith-based content. Ignore any logistical announcements, church business, administrative updates, building/location discussions, or non-spiritual content in the sermon. Return valid JSON only. No markdown, no code fences." },
              { role: "user", content: ct.prompt },
            ],
            tools: [buildToolSchema(ct.type)],
            tool_choice: { type: "function", function: { name: `generate_${ct.type}` } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI error for ${ct.type}: ${aiResponse.status} ${errText}`);
        }

        const aiResult = await aiResponse.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        let content = {};

        if (toolCall?.function?.arguments) {
          try {
            content = JSON.parse(toolCall.function.arguments);
          } catch {
            throw new Error(`Failed to parse AI response for ${ct.type}`);
          }
        }

        await supabase.from("sermon_content").insert({
          sermon_id: sermon.id,
          content_type: ct.type,
          content,
        });

        console.log(`Generated ${ct.type} successfully`);
        return ct.type;
      })
    );

    // Collect failures
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        console.error(result.reason);
        failedTypes.push(missingTypes[i].type);
      }
    }

    if (failedTypes.length > 0 && job.attempts < job.max_attempts) {
      const backoffMinutes = [1, 2, 5, 5, 5];
      const delayMinutes = backoffMinutes[Math.min(job.attempts - 1, backoffMinutes.length - 1)];
      const retryAfter = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

      console.log(`${failedTypes.length} content types failed, scheduling retry in ${delayMinutes}min (attempt ${job.attempts}/${job.max_attempts})`);
      await supabase
        .from("sermon_jobs")
        .update({
          status: "retrying",
          locked_until: retryAfter,
          current_stage: null,
          error_message: `Failed content types: ${failedTypes.join(", ")}. Retrying in ${delayMinutes}min.`,
          error_details: { failed_types: failedTypes, attempt: job.attempts },
        })
        .eq("id", job.id);

      return new Response(JSON.stringify({
        success: false,
        sermon_id: sermon.id,
        message: `Retrying ${failedTypes.length} failed content types`,
        failed_types: failedTypes,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (failedTypes.length > 0) {
      console.error(`Max retries reached. Still missing: ${failedTypes.join(", ")}`);
      await supabase
        .from("sermon_jobs")
        .update({
          status: "failed",
          error_message: `Failed after ${job.max_attempts} attempts. Missing: ${failedTypes.join(", ")}`,
          error_details: { failed_types: failedTypes, attempt: job.attempts },
          failed_at: new Date().toISOString(),
          current_stage: null,
        })
        .eq("id", job.id);

      const generatedCount = allContentTypes.length - failedTypes.length;
      if (generatedCount > 0) {
        await supabase.from("sermons").update({ status: "review" }).eq("id", sermon.id);
      } else {
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermon.id);
      }

      return new Response(JSON.stringify({
        success: false,
        sermon_id: sermon.id,
        message: `Completed with ${failedTypes.length} missing content types after ${job.max_attempts} attempts`,
        failed_types: failedTypes,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("sermons")
      .update({ status: "review" })
      .eq("id", sermon.id);

    await supabase
      .from("sermon_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: null,
        error_details: null,
        current_stage: null,
      })
      .eq("id", job.id);

    console.log(`Sermon ${sermon.id} processed successfully — all content generated`);

    return new Response(JSON.stringify({
      success: true,
      sermon_id: sermon.id,
      message: "Sermon processed successfully — all content generated",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("process-sermon error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Regeneration handler ───

async function handleRegeneration(supabase: any, lovableApiKey: string, sermonId: string, contentType: string, itemIndex?: number) {
  try {
    const { data: sermon } = await supabase
      .from("sermons")
      .select("id, title, storage_path")
      .eq("id", sermonId)
      .single();

    if (!sermon) {
      return new Response(JSON.stringify({ error: "Sermon not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: transcript } = await supabase
      .from("sermon_transcripts")
      .select("full_text")
      .eq("sermon_id", sermonId)
      .single();

    if (!transcript?.full_text) {
      return new Response(JSON.stringify({ error: "No transcript found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcriptText = transcript.full_text;

    const promptBuilders: Record<string, (title: string, text: string) => string> = {
      spark: buildSparkPrompt,
      takeaways: buildTakeawaysPrompt,
      reflection_questions: buildReflectionPrompt,
      scriptures: buildScripturesPrompt,
      chapters: buildChaptersPrompt,
    };

    const builder = promptBuilders[contentType];
    if (!builder) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If item_index is provided, we regenerate only that single item
    if (itemIndex !== undefined) {
      // Get existing content first
      const { data: existingRow } = await supabase
        .from("sermon_content")
        .select("content")
        .eq("sermon_id", sermonId)
        .eq("content_type", contentType)
        .single();

      if (!existingRow) {
        return new Response(JSON.stringify({ error: "No existing content to update" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existingContent = existingRow.content;
      const arrayKey = contentType === "spark" ? "sparks" : contentType === "takeaways" ? "takeaways" : contentType === "reflection_questions" ? "questions" : contentType === "scriptures" ? "scriptures" : "chapters";
      const existingArray = existingContent[arrayKey] || [];

      if (itemIndex < 0 || itemIndex >= existingArray.length) {
        return new Response(JSON.stringify({ error: "Invalid item index" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build a prompt that asks for just ONE item
      const currentItem = existingArray[itemIndex];
      let singlePrompt = "";
      if (contentType === "spark") {
        singlePrompt = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptText}\n\nGenerate a SINGLE new daily spark for ${currentItem.day}. It must be different from: "${currentItem.title} - ${currentItem.summary}". Provide a fresh, unique angle on the sermon's spiritual message for that day. Focus only on spiritual, biblical, and faith-based content.`;
      } else if (contentType === "takeaways") {
        singlePrompt = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptText}\n\nGenerate ONE new key spiritual takeaway from this sermon. It must be different from: "${currentItem.title}". Provide a fresh insight. Focus EXCLUSIVELY on biblical truths and spiritual growth.`;
      } else if (contentType === "reflection_questions") {
        singlePrompt = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptText}\n\nGenerate ONE new reflection question for ${currentItem.day || "this day"}. It must be different from: "${currentItem.question}".\n\nRules:\n- Use SECOND PERSON ("you", "your") — never first person ("I", "my")\n- NEVER reference "the sermon", "the preacher", the speaker, or any meta-framing\n- The question should feel standalone and personal, as if a wise pastor is asking directly\n- Include brief spiritual context (also in second person)`;
      } else if (contentType === "scriptures") {
        singlePrompt = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptText}\n\nIdentify ONE scripture reference from the sermon that is different from: "${currentItem.reference}". Provide the reference, a brief context note, and how it connects to the sermon.`;
      } else {
        singlePrompt = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptText}\n\nGenerate ONE sermon chapter/section that is different from: "${currentItem.title}". Include title, summary, order number ${currentItem.order || itemIndex + 1}, and timestamp.\n\nRules:\n- Only create a chapter where there is a genuine shift in topic, theme, or focus\n- The chapter should represent a meaningful, distinct section — not a brief aside or transition\n- Make sure the chapter fits naturally within the full sermon duration and doesn't duplicate coverage of existing chapters`;
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a sermon content analyst for a church app. You focus exclusively on spiritual, biblical, and faith-based content. Return valid JSON only. No markdown, no code fences." },
            { role: "user", content: singlePrompt },
          ],
          tools: [buildToolSchema(contentType)],
          tool_choice: { type: "function", function: { name: `generate_${contentType}` } },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`Single item regen AI error:`, errText);
        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      let newContent: any = {};

      if (toolCall?.function?.arguments) {
        newContent = JSON.parse(toolCall.function.arguments);
      }

      // Extract the single new item from the response array
      const newArray = newContent[arrayKey] || [];
      const newItem = newArray[0] || newContent;

      // Merge back into existing array
      const updatedArray = [...existingArray];
      if ((contentType === "spark" || contentType === "reflection_questions") && currentItem.day) {
        updatedArray[itemIndex] = { ...newItem, day: currentItem.day }; // preserve day
      } else {
        updatedArray[itemIndex] = newItem;
      }

      const updatedContent = { ...existingContent, [arrayKey]: updatedArray };

      await supabase
        .from("sermon_content")
        .update({ content: updatedContent })
        .eq("sermon_id", sermonId)
        .eq("content_type", contentType);

      console.log(`Regenerated single ${contentType} item ${itemIndex} for sermon ${sermonId}`);

      return new Response(JSON.stringify({ success: true, content_type: contentType, content: updatedContent, item_index: itemIndex }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full regeneration (existing behavior)
    const prompt = builder(sermon.title, transcriptText);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a sermon content analyst for a church app. You focus exclusively on spiritual, biblical, and faith-based content. Ignore any logistical announcements, church business, administrative updates, building/location discussions, or non-spiritual content in the sermon. Return valid JSON only. No markdown, no code fences." },
          { role: "user", content: prompt },
        ],
        tools: [buildToolSchema(contentType)],
        tool_choice: { type: "function", function: { name: `generate_${contentType}` } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`Regeneration AI error for ${contentType}:`, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let content = {};

    if (toolCall?.function?.arguments) {
      content = JSON.parse(toolCall.function.arguments);
    }

    await supabase
      .from("sermon_content")
      .delete()
      .eq("sermon_id", sermonId)
      .eq("content_type", contentType);

    await supabase.from("sermon_content").insert({
      sermon_id: sermonId,
      content_type: contentType,
      content,
    });

    console.log(`Regenerated ${contentType} for sermon ${sermonId}`);

    return new Response(JSON.stringify({ success: true, content_type: contentType, content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Regeneration error:", e);
    return new Response(JSON.stringify({ error: "Regeneration failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function failJob(supabase: any, jobId: string, message: string) {
  await supabase
    .from("sermon_jobs")
    .update({
      status: "failed",
      error_message: message,
      failed_at: new Date().toISOString(),
      current_stage: null,
    })
    .eq("id", jobId);
}

// --- Embed timing markers into transcript text ---

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

  // Build transcript directly from wordTimings to guarantee accurate timestamps
  for (const word of wordTimings) {
    const currentTime = word.start;

    if (currentTime - lastMarkerTime >= INTERVAL) {
      result += `[${formatTimestamp(currentTime)}] `;
      lastMarkerTime = currentTime;
    }
    result += word.text + " ";
  }

  console.log(`embedTimingMarkers: built transcript from ${wordTimings.length} words, last marker at ${formatTimestamp(lastMarkerTime)}`);

  return result.trim();
}

// --- Tool schemas for structured output ---

function buildToolSchema(type: string) {
  const schemas: Record<string, any> = {
    spark: {
      type: "function",
      function: {
        name: "generate_spark",
        description: "Generate 7 daily sparks, one for each day of the week (Monday through Sunday)",
        parameters: {
          type: "object",
          properties: {
            sparks: {
              type: "array",
              description: "Array of 7 sparks, one for each day of the week",
              items: {
                type: "object",
                properties: {
                  day: { type: "string", description: "Day of the week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday" },
                  title: { type: "string", description: "A catchy title for this day's spark" },
                  summary: { type: "string", description: "A 1-2 sentence short summary applying the sermon's spiritual message to this day" },
                },
                required: ["day", "title", "summary"],
                additionalProperties: false,
              },
            },
          },
          required: ["sparks"],
          additionalProperties: false,
        },
      },
    },
    takeaways: {
      type: "function",
      function: {
        name: "generate_takeaways",
        description: "Generate key spiritual takeaways from the sermon",
        parameters: {
          type: "object",
          properties: {
            takeaways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["takeaways"],
          additionalProperties: false,
        },
      },
    },
    reflection_questions: {
      type: "function",
      function: {
        name: "generate_reflection_questions",
        description: "Generate 7 reflection questions, one for each day of the week (Monday through Sunday)",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              description: "Array of 7 reflection questions, one for each day of the week",
              items: {
                type: "object",
                properties: {
                  day: { type: "string", description: "Day of the week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday" },
                  question: { type: "string", description: "A thought-provoking question in second person (you/your)" },
                  context: { type: "string", description: "Brief spiritual context in second person (you/your)" },
                },
                required: ["day", "question", "context"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    },
    scriptures: {
      type: "function",
      function: {
        name: "generate_scriptures",
        description: "Extract scripture references mentioned in the sermon",
        parameters: {
          type: "object",
          properties: {
            scriptures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reference: { type: "string", description: "Book chapter:verse format, e.g. Luke 5:1-7" },
                  text: { type: "string", description: "A brief 1-sentence note about how this scripture was used in the sermon" },
                  context: { type: "string", description: "How this scripture connects to the sermon's message" },
                },
                required: ["reference", "text", "context"],
                additionalProperties: false,
              },
            },
          },
          required: ["scriptures"],
          additionalProperties: false,
        },
      },
    },
    chapters: {
      type: "function",
      function: {
        name: "generate_chapters",
        description: "Identify 6-10 main structural chapters of the sermon (introduction, scripture reading, main points, major stories, closing). Do not include sub-points, illustrations, or transitions as separate chapters.",
        parameters: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, descriptive chapter title" },
                  summary: { type: "string", description: "1-2 sentence summary of this section" },
                  order: { type: "number" },
                  timestamp: { type: "string", description: "Timestamp in M:SS or H:MM:SS format from the nearest timing marker, e.g. 5:23 or 1:05:23" },
                },
                required: ["title", "summary", "order", "timestamp"],
                additionalProperties: false,
              },
            },
          },
          required: ["chapters"],
          additionalProperties: false,
        },
      },
    },
  };

  return schemas[type];
}

// --- Prompts (full transcript, spiritual focus) ---

function buildSparkPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"

Transcript:
${transcript}

Generate 7 "Daily Sparks" — one for each day of the week (Monday through Sunday). Each spark should have:
- A catchy, unique title
- A 1-2 sentence short summary that applies the sermon's core spiritual message to that day

Each spark should feel fresh and offer a different angle or application of the sermon's biblical truths. Monday's spark might focus on starting the week with purpose, while Sunday's might focus on worship and gratitude. Focus only on spiritual, biblical, and faith-based content. Ignore any logistical announcements or church business.`;
}

function buildTakeawaysPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"

Transcript:
${transcript}

Extract 3-5 key SPIRITUAL takeaways from this sermon. Each should have a clear title and a 1-2 sentence description. Focus EXCLUSIVELY on:
- Biblical truths and principles
- Faith-based insights and spiritual growth points
- Actionable spiritual truths that listeners can apply to their walk with God

IGNORE completely:
- Church logistics (building, location, lease, finances)
- Administrative announcements
- Event promotions or scheduling
- Any non-spiritual content`;
}

function buildReflectionPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"

Transcript:
${transcript}

Generate exactly 7 reflection questions — one for each day of the week (Monday through Sunday). Each question should:
- Be written in SECOND PERSON ("you", "your") — NEVER first person ("I", "my")
- Feel standalone and personal, as if a wise pastor is asking the reader directly
- NEVER reference "the sermon", "the preacher", the speaker, or any meta-framing like "the message emphasizes"
- Explore a different angle of the sermon's spiritual truths each day
- Help the reader examine their faith and relationship with God

Each question needs a "day" field and brief spiritual context (also in second person).

Focus only on spiritual, biblical, and faith-based content. Ignore any logistical announcements or church business.`;
}

function buildScripturesPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"

Transcript:
${transcript}

Identify all Bible verses referenced or quoted in this sermon. For each, provide:
- The reference in standard format (e.g. "Luke 5:1-7", "Romans 8:28")
- A brief 1-sentence note about how this scripture was used in the sermon (NOT the full scripture text — just a short context note)
- How it connects to the sermon's spiritual message

Only include scriptures that were actually mentioned or directly referenced by the speaker.`;
}

function buildChaptersPrompt(title: string, transcriptWithTimings: string) {
  return `You are a sermon chapter generator. Sermon title: "${title}"

Transcript (with timing markers like [5:23]):
${transcriptWithTimings}

Identify only the main structural chapters of this sermon. This includes:
- The introduction
- Scripture reading
- Sermon title / thesis statement
- Each main point
- Any major illustrative stories
- The closing prayer or altar call

Do NOT include sub-points, illustrations, or transitions as their own chapters.

For each chapter:
- Give it a clear, descriptive title
- Write a 1-2 sentence summary
- Assign an order number (1, 2, 3, ...)
- Use the nearest timing marker [M:SS] or [H:MM:SS] as the timestamp for where this chapter begins

CRITICAL RULES:
- Keep the total number of chapters between 6 and 10.
- The first chapter MUST start at or near 0:00.
- The last chapter MUST begin in the final portion of the sermon.
- Chapters MUST span the ENTIRE sermon duration — do NOT cluster them in the first half.
- Use the timing markers embedded in the transcript to determine accurate timestamps.`;
}
