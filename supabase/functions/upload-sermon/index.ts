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
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify auth and get user info
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

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const speaker = formData.get("speaker") as string | null;
    const sermonDate = formData.get("sermon_date") as string | null;
    const subtitle = formData.get("subtitle") as string | null;

    if (!file || !title) {
      return new Response(JSON.stringify({ error: "File and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const allowedTypes = [
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg",
      "audio/aac", "audio/m4a", "audio/x-m4a",
      "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: `Unsupported file type: ${file.type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate storage path
    const ext = file.name.split(".").pop() || "mp4";
    const timestamp = Date.now();
    const storagePath = `${churchId}/${timestamp}-${file.name}`;

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("sermon-media")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine source type
    const isVideo = file.type.startsWith("video/");
    const sourceType = "upload";

    // Create sermon record
    const { data: sermon, error: sermonError } = await supabaseAdmin
      .from("sermons")
      .insert({
        title,
        speaker: speaker || null,
        subtitle: subtitle || null,
        sermon_date: sermonDate || new Date().toISOString().split("T")[0],
        church_id: churchId,
        source_type: sourceType,
        storage_path: storagePath,
        uploaded_by: user.id,
        status: "pending",
        is_published: false,
        is_current: false,
      })
      .select()
      .single();

    if (sermonError) {
      console.error("Sermon insert error:", sermonError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from("sermon-media").remove([storagePath]);
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
      // Still return success — sermon was created, job can be retried
    }

    // Immediately trigger processing (fire-and-forget, cron is the safety net)
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
      // Not critical — cron will pick it up within 1 minute
    }

    return new Response(JSON.stringify({
      success: true,
      sermon_id: sermon.id,
      status: "queued",
      message: "Sermon uploaded and processing started",
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
