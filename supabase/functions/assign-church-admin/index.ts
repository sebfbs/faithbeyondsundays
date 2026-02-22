import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a platform admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;
    const { data: isAdmin } = await anonClient.rpc("is_platform_admin", { _user_id: callerId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: not a platform admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { church_id, admin_email } = await req.json();
    if (!church_id || !admin_email) {
      return new Response(JSON.stringify({ error: "church_id and admin_email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find or create user
    let userId: string;
    let isNewUser = false;

    const { data: listData } = await serviceClient.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === admin_email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: admin_email,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      isNewUser = true;
    }

    // Assign owner role (on conflict do nothing)
    const { error: roleError } = await serviceClient
      .from("user_roles")
      .upsert(
        { user_id: userId, church_id, role: "owner" },
        { onConflict: "user_id,church_id", ignoreDuplicates: true }
      );
    if (roleError) {
      // If upsert fails due to no unique constraint on (user_id, church_id), try insert
      if (roleError.code === "42P10" || roleError.message.includes("unique")) {
        await serviceClient.from("user_roles").insert({ user_id: userId, church_id, role: "owner" });
      } else {
        throw roleError;
      }
    }

    // Ensure profile exists
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("church_id", church_id)
      .maybeSingle();

    if (!existingProfile) {
      const username = admin_email.split("@")[0].replace(/[^a-z0-9]/gi, "") + Math.floor(Math.random() * 1000);
      await serviceClient.from("profiles").insert({
        user_id: userId,
        church_id,
        username,
        onboarding_complete: false,
      });
    }

    return new Response(
      JSON.stringify({ user_id: userId, is_new_user: isNewUser, email: admin_email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("assign-church-admin error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
