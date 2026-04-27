import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SPARK_PROMPT = `Write a 1-2 sentence reflection grounded in Christian faith. Keep it short and to the point — no more than two sentences. It should feel like quiet wisdom -- something you'd read and sit with for a moment. Do NOT start with a greeting like 'Good morning' or 'Hey'. Do NOT address the reader directly as 'buddy', 'friend', or 'you' in a casual way. Do NOT include Bible verse references or citations. Do NOT use hashtags or exclamation marks. The tone should be calm, thoughtful, and grounded -- like something a wise pastor would write in a devotional book, not a text message to a friend. Examples of the right tone: 'God is already in this moment with you. You don't have to go looking for Him.' and 'Never underestimate the impact of a small act of kindness today.' Write one original message in this style. Return ONLY the message text, nothing else.`;

const REFLECTION_PROMPT = `Write a single thought-provoking reflection question rooted in Christian faith. It should make someone genuinely pause and think. Do NOT make it generic like 'How are you feeling today?' or 'What are you grateful for?' -- it should have depth and specificity. Do NOT start with 'Hey' or any greeting. Do NOT include Bible verse references. The tone should feel like a question from a thoughtful pastor during a quiet moment, not a therapy session or a pep talk. Examples of the right tone: 'What would look different in your week if you truly believed God was already in the middle of it?' and 'Is there something you've been holding onto that you know God has been asking you to release?' Write one original question. Return ONLY the question text, nothing else.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Return cached content if already generated today
    const { data: cached } = await supabase
      .from("daily_content")
      .select("spark_message, reflection_prompt")
      .eq("content_date", today)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate with Claude using tool calling for structured output
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: "You are a content generator for a Christian faith app. Generate daily devotional content with the exact tone specified. Never add greetings, Bible citations, hashtags, or exclamation marks.",
        messages: [
          {
            role: "user",
            content: `Generate today's daily content. For the spark: ${SPARK_PROMPT}\n\nFor the reflection: ${REFLECTION_PROMPT}`,
          },
        ],
        tools: [
          {
            name: "save_daily_content",
            description: "Save the generated daily spark message and reflection prompt.",
            input_schema: {
              type: "object",
              properties: {
                spark_message: {
                  type: "string",
                  description: "A 1-2 sentence calm, grounded reflection on faith. No greetings, no Bible refs, no exclamation marks.",
                },
                reflection_prompt: {
                  type: "string",
                  description: "A single thought-provoking question rooted in faith. No greetings, no Bible refs.",
                },
              },
              required: ["spark_message", "reflection_prompt"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "save_daily_content" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("Anthropic API error:", status, text);
      throw new Error(`Anthropic API returned ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolUse = aiData.content?.find((c: any) => c.type === "tool_use");

    if (!toolUse?.input) {
      throw new Error("No tool use in AI response");
    }

    const { spark_message: sparkMessage, reflection_prompt: reflectionPrompt } = toolUse.input;

    if (!sparkMessage || !reflectionPrompt) {
      throw new Error("Missing fields in AI response");
    }

    const { error: insertError } = await supabase
      .from("daily_content")
      .insert({
        content_date: today,
        spark_message: sparkMessage,
        reflection_prompt: reflectionPrompt,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      // Still return the content even if caching fails
    }

    return new Response(JSON.stringify({ spark_message: sparkMessage, reflection_prompt: reflectionPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-daily-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
