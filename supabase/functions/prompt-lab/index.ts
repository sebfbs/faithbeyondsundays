import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Auth: valid JWT required
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { mode, sermon_id, content_type, prompt_instructions, messages, new_message } = body;

    const SYSTEM_PROMPT = `You are a sermon content expert helping a church app founder refine AI-generated content. Be direct and collaborative. When asked to revise content, provide the revised version clearly and completely. Focus on spiritual, biblical, and faith-based content.`;

    // ─── Generate: initial structured content generation ───
    if (mode === "generate") {
      if (!sermon_id || !content_type || !prompt_instructions) {
        return new Response(JSON.stringify({ error: "Missing sermon_id, content_type, or prompt_instructions" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sermon } = await supabase
        .from("sermons")
        .select("id, title")
        .eq("id", sermon_id)
        .single();

      if (!sermon) {
        return new Response(JSON.stringify({ error: "Sermon not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: transcriptRow } = await supabase
        .from("sermon_transcripts")
        .select("full_text")
        .eq("sermon_id", sermon_id)
        .single();

      if (!transcriptRow?.full_text) {
        return new Response(JSON.stringify({ error: "No transcript found for this sermon. Process the sermon first." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userMessage = `Sermon title: "${sermon.title}"\n\nTranscript:\n${transcriptRow.full_text}\n\n${prompt_instructions}`;
      const tool = buildToolSchema(content_type);

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
          tools: [tool],
          tool_choice: { type: "tool", name: tool.name },
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Anthropic API error: ${aiResponse.status} ${errText}`);
      }

      const aiData = await aiResponse.json();
      const toolUse = aiData.content?.find((c: any) => c.type === "tool_use");

      if (!toolUse?.input) {
        throw new Error("No structured output from AI");
      }

      const content = toolUse.input;
      // Serialize the structured output as readable text so it can anchor the chat history
      const assistantText = serializeContent(content_type, content);

      return new Response(JSON.stringify({
        type: "generated",
        content,
        // The frontend stores these messages and sends them back on each chat turn
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: assistantText },
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Chat: continue the conversation ───
    if (mode === "chat") {
      if (!messages || !new_message) {
        return new Response(JSON.stringify({ error: "Missing messages or new_message" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updatedMessages = [
        ...messages,
        { role: "user", content: new_message },
      ];

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: updatedMessages,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Anthropic API error: ${aiResponse.status} ${errText}`);
      }

      const aiData = await aiResponse.json();
      const reply = aiData.content?.find((c: any) => c.type === "text")?.text || "";

      return new Response(JSON.stringify({
        type: "chat",
        reply,
        messages: [...updatedMessages, { role: "assistant", content: reply }],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode. Use 'generate' or 'chat'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("prompt-lab error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Convert structured content into readable text for chat history context
function serializeContent(contentType: string, content: any): string {
  if (contentType === "spark" && content.sparks) {
    return content.sparks
      .map((s: any) => `${s.day} — "${s.title}"\n${s.summary}`)
      .join("\n\n");
  }
  if (contentType === "reflection_questions" && content.questions) {
    return content.questions
      .map((q: any) => `${q.day} — ${q.question}\nContext: ${q.context}`)
      .join("\n\n");
  }
  if (contentType === "takeaways" && content.takeaways) {
    return content.takeaways
      .map((t: any) => `• ${t.title}: ${t.description}`)
      .join("\n");
  }
  if (contentType === "scriptures" && content.scriptures) {
    return content.scriptures
      .map((s: any) => `${s.reference} — ${s.text}`)
      .join("\n");
  }
  if (contentType === "chapters" && content.chapters) {
    return content.chapters
      .map((c: any) => `[${c.timestamp}] ${c.title}: ${c.summary}`)
      .join("\n");
  }
  return JSON.stringify(content, null, 2);
}

// Tool schemas matching process-sermon exactly
function buildToolSchema(type: string) {
  const schemas: Record<string, any> = {
    spark: {
      name: "generate_spark",
      description: "Generate 7 daily sparks, one for each day of the week",
      input_schema: {
        type: "object",
        properties: {
          sparks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                title: { type: "string" },
                summary: { type: "string" },
              },
              required: ["day", "title", "summary"],
            },
          },
        },
        required: ["sparks"],
      },
    },
    reflection_questions: {
      name: "generate_reflection_questions",
      description: "Generate 7 reflection questions, one for each day of the week",
      input_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                question: { type: "string" },
                context: { type: "string" },
              },
              required: ["day", "question", "context"],
            },
          },
        },
        required: ["questions"],
      },
    },
    takeaways: {
      name: "generate_takeaways",
      description: "Generate key spiritual takeaways from the sermon",
      input_schema: {
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
            },
          },
        },
        required: ["takeaways"],
      },
    },
    scriptures: {
      name: "generate_scriptures",
      description: "Extract scripture passages directly quoted or discussed by the pastor",
      input_schema: {
        type: "object",
        properties: {
          scriptures: {
            type: "array",
            items: {
              type: "object",
              properties: {
                reference: { type: "string" },
                text: { type: "string" },
              },
              required: ["reference", "text"],
            },
          },
        },
        required: ["scriptures"],
      },
    },
    chapters: {
      name: "generate_chapters",
      description: "Identify 6-10 main structural chapters of the sermon",
      input_schema: {
        type: "object",
        properties: {
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                order: { type: "number" },
                timestamp: { type: "string" },
              },
              required: ["title", "summary", "order", "timestamp"],
            },
          },
        },
        required: ["chapters"],
      },
    },
  };
  return schemas[type];
}
