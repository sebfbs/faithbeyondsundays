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
  const workerId = crypto.randomUUID();

  try {
    // Claim a queued or retrying job using optimistic locking
    const now = new Date().toISOString();

    // Fetch queued jobs directly, and retrying jobs that have waited long enough (backoff)
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

    // Try to claim the job
    const { data: claimedRows, error: lockError } = await supabase
      .from("sermon_jobs")
      .update({
        status: "processing",
        worker_id: workerId,
        started_at: isRetry ? job.started_at : now,
        attempts: job.attempts + 1,
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

    // Get sermon details
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

    // On retry, skip transcription if transcript already exists
    const { data: existingTranscript } = await supabase
      .from("sermon_transcripts")
      .select("id, full_text")
      .eq("sermon_id", sermon.id)
      .maybeSingle();

    let transcriptText = existingTranscript?.full_text || "";

    if (!existingTranscript) {
      // Update sermon status to transcribing
      await supabase
        .from("sermons")
        .update({ status: "transcribing" })
        .eq("id", sermon.id);

      // Step 1: Download file from storage
      console.log("Downloading file from storage:", sermon.storage_path);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("sermon-media")
        .download(sermon.storage_path!);

      if (downloadError || !fileData) {
        await failJob(supabase, job.id, "Failed to download file from storage");
        await supabase.from("sermons").update({ status: "failed" }).eq("id", sermon.id);
        return new Response(JSON.stringify({ error: "Download failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 2: Transcribe with ElevenLabs Scribe
      console.log("Transcribing with ElevenLabs...");
      const transcribeFormData = new FormData();
      transcribeFormData.append("file", fileData, sermon.storage_path!.split("/").pop()!);
      transcribeFormData.append("model_id", "scribe_v2");
      transcribeFormData.append("tag_audio_events", "false");
      transcribeFormData.append("diarize", "false");

      const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": elevenlabsKey },
        body: transcribeFormData,
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
      const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;

      // Save transcript
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
    } // end if (!existingTranscript)

    // Step 3: Generate AI content (only missing types)
    console.log("Generating AI content...");
    await supabase.from("sermons").update({ status: "generating" }).eq("id", sermon.id);

    // Check which content types already exist
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
      { type: "chapters", prompt: buildChaptersPrompt(sermon.title, transcriptText) },
      { type: "weekly_challenge", prompt: buildChallengePrompt(sermon.title, transcriptText) },
      { type: "weekend_reflection", prompt: buildWeekendReflectionPrompt(sermon.title, transcriptText) },
    ];

    // Only generate what's missing
    const missingTypes = allContentTypes.filter((ct) => !existingTypes.has(ct.type));
    const failedTypes: string[] = [];

    if (missingTypes.length === 0) {
      console.log("All content types already generated");
    }

    for (const ct of missingTypes) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a sermon content analyst for a church app. Return valid JSON only. No markdown, no code fences." },
              { role: "user", content: ct.prompt },
            ],
            tools: [buildToolSchema(ct.type)],
            tool_choice: { type: "function", function: { name: `generate_${ct.type}` } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${ct.type}:`, aiResponse.status, errText);
          failedTypes.push(ct.type);
          continue;
        }

        const aiResult = await aiResponse.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        let content = {};

        if (toolCall?.function?.arguments) {
          try {
            content = JSON.parse(toolCall.function.arguments);
          } catch {
            console.error(`Failed to parse AI response for ${ct.type}`);
            failedTypes.push(ct.type);
            continue;
          }
        }

        await supabase.from("sermon_content").insert({
          sermon_id: sermon.id,
          content_type: ct.type,
          content,
        });

        console.log(`Generated ${ct.type} successfully`);
      } catch (err) {
        console.error(`Error generating ${ct.type}:`, err);
        failedTypes.push(ct.type);
      }
    }

    // Step 4: Determine final status
    if (failedTypes.length > 0 && job.attempts < job.max_attempts) {
      // Some content failed but we have retries left — schedule automatic retry
      // Backoff: 1min, 5min, 15min, 30min per attempt
      const backoffMinutes = [1, 5, 15, 30];
      const delayMinutes = backoffMinutes[Math.min(job.attempts - 1, backoffMinutes.length - 1)];
      const retryAfter = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

      console.log(`${failedTypes.length} content types failed, scheduling retry in ${delayMinutes}min (attempt ${job.attempts}/${job.max_attempts})`);
      await supabase
        .from("sermon_jobs")
        .update({
          status: "retrying",
          locked_until: retryAfter,
          error_message: `Failed content types: ${failedTypes.join(", ")}. Retrying in ${delayMinutes}min.`,
          error_details: { failed_types: failedTypes, attempt: job.attempts },
        })
        .eq("id", job.id);

      // Keep sermon in "generating" so users know it's still being worked on
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
      // Max retries exhausted — mark as failed
      console.error(`Max retries reached. Still missing: ${failedTypes.join(", ")}`);
      await supabase
        .from("sermon_jobs")
        .update({
          status: "failed",
          error_message: `Failed after ${job.max_attempts} attempts. Missing: ${failedTypes.join(", ")}`,
          error_details: { failed_types: failedTypes, attempt: job.attempts },
          failed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Still mark sermon as complete if most content generated
      const generatedCount = allContentTypes.length - failedTypes.length;
      if (generatedCount > 0) {
        await supabase.from("sermons").update({ status: "complete" }).eq("id", sermon.id);
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

    // All content generated successfully!
    await supabase
      .from("sermons")
      .update({ status: "complete" })
      .eq("id", sermon.id);

    await supabase
      .from("sermon_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: null,
        error_details: null,
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function failJob(supabase: any, jobId: string, message: string) {
  await supabase
    .from("sermon_jobs")
    .update({
      status: "failed",
      error_message: message,
      failed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

// --- Tool schemas for structured output ---

function buildToolSchema(type: string) {
  const schemas: Record<string, any> = {
    spark: {
      type: "function",
      function: {
        name: "generate_spark",
        description: "Generate a sermon spark summary",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "A catchy title for the spark" },
            summary: { type: "string", description: "A 2-3 sentence engaging summary of the sermon's core message" },
          },
          required: ["title", "summary"],
          additionalProperties: false,
        },
      },
    },
    takeaways: {
      type: "function",
      function: {
        name: "generate_takeaways",
        description: "Generate key takeaways from the sermon",
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
        description: "Generate reflection questions for personal study",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  context: { type: "string", description: "Brief context connecting this question to the sermon" },
                },
                required: ["question", "context"],
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
        description: "Extract and list scripture references from the sermon",
        parameters: {
          type: "object",
          properties: {
            scriptures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reference: { type: "string", description: "e.g. John 3:16" },
                  text: { type: "string", description: "The scripture text" },
                  context: { type: "string", description: "How this scripture was used in the sermon" },
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
        description: "Divide the sermon into logical chapters/sections",
        parameters: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string", description: "1-2 sentence summary of this section" },
                  order: { type: "number" },
                },
                required: ["title", "summary", "order"],
                additionalProperties: false,
              },
            },
          },
          required: ["chapters"],
          additionalProperties: false,
        },
      },
    },
    weekly_challenge: {
      type: "function",
      function: {
        name: "generate_weekly_challenge",
        description: "Generate a weekly challenge based on the sermon",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Challenge title" },
            description: { type: "string", description: "What the challenge is and why it matters" },
            steps: {
              type: "array",
              items: { type: "string" },
              description: "3-5 concrete action steps",
            },
          },
          required: ["title", "description", "steps"],
          additionalProperties: false,
        },
      },
    },
    weekend_reflection: {
      type: "function",
      function: {
        name: "generate_weekend_reflection",
        description: "Generate a weekend reflection prompt",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            reflection: { type: "string", description: "A thoughtful paragraph for weekend meditation" },
            prayer: { type: "string", description: "A short closing prayer related to the sermon" },
          },
          required: ["title", "reflection", "prayer"],
          additionalProperties: false,
        },
      },
    },
  };

  return schemas[type];
}

// --- Prompts ---

function buildSparkPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nGenerate a "Spark" — a catchy title and a 2-3 sentence engaging summary that captures the core message. Make it inspiring and accessible.`;
}

function buildTakeawaysPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nExtract 3-5 key takeaways. Each should have a clear title and a 1-2 sentence description explaining the point.`;
}

function buildReflectionPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nCreate 4-6 thought-provoking reflection questions for personal study. Include brief context connecting each question to the sermon.`;
}

function buildScripturesPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nIdentify all Bible verses referenced or relevant to this sermon. For each, provide the reference, the text, and how it was used.`;
}

function buildChaptersPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 12000)}\n\nDivide this sermon into 4-8 logical chapters/sections. Each should have a clear title, a 1-2 sentence summary, and an order number.`;
}

function buildChallengePrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nCreate a weekly challenge inspired by this sermon. Include a title, description of the challenge, and 3-5 concrete action steps people can take this week.`;
}

function buildWeekendReflectionPrompt(title: string, transcript: string) {
  return `Sermon title: "${title}"\n\nTranscript:\n${transcript.slice(0, 8000)}\n\nCreate a weekend reflection with a title, a thoughtful paragraph for meditation, and a short closing prayer related to the sermon's message.`;
}
