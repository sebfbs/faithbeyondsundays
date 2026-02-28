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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has pastor/admin/owner role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role, church_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "pastor"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const churchId = roles[0].church_id;

    // Parse JSON body (no file — file was uploaded directly to storage by the client)
    const { title, speaker, sermon_date, subtitle, storage_path, media_type } = await req.json();

    if (!title || !storage_path) {
      return new Response(JSON.stringify({ error: "Title and storage_path are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the storage_path starts with this church's ID (prevent cross-church injection)
    if (!storage_path.startsWith(`${churchId}/`)) {
      return new Response(JSON.stringify({ error: "Storage path does not match your church" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create sermon record
    const { data: sermon, error: sermonError } = await supabaseAdmin
      .from("sermons")
      .insert({
        title,
        speaker: speaker || null,
        subtitle: subtitle || null,
        sermon_date: sermon_date || new Date().toISOString().split("T")[0],
        church_id: churchId,
        source_type: "upload",
        storage_path,
        media_type: media_type || null,
        uploaded_by: user.id,
        status: "pending",
        is_published: false,
        is_current: false,
      })
      .select()
      .single();

    if (sermonError) {
      console.error("Sermon insert error:", sermonError);
      return new Response(JSON.stringify({ error: "Failed to create sermon record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a processing job
    const { error: jobError } = await supabaseAdmin
      .from("sermon_jobs")
      .insert({
        sermon_id: sermon.id,
        church_id: churchId,
        job_type: "full_pipeline",
        status: "queued",
        priority: 0,
      });

    if (jobError) {
      console.error("Job insert error:", jobError);
    }

    // Fire-and-forget trigger processing
    try {
      const processUrl = `${supabaseUrl}/functions/v1/process-sermon`;
      fetch(processUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")}`,
        },
        body: JSON.stringify({}),
      }).catch((err) => console.error("Fire-and-forget process trigger failed:", err));
    } catch (triggerErr) {
      console.error("Failed to trigger immediate processing:", triggerErr);
    }

    return new Response(JSON.stringify({
      success: true,
      sermon_id: sermon.id,
      status: "queued",
      message: "Sermon created and processing started",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("upload-sermon error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
