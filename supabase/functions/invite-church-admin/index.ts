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

    const callerId = claimsData.claims.sub as string;

    const { church_id, email, role } = await req.json();
    if (!church_id || !email || !role) {
      return new Response(JSON.stringify({ error: "church_id, email, and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "pastor"].includes(role)) {
      return new Response(JSON.stringify({ error: "role must be admin or pastor" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller has owner or admin role in this church
    const { data: isOwner } = await anonClient.rpc("has_role_in_church", {
      _user_id: callerId, _church_id: church_id, _role: "owner",
    });
    const { data: isAdmin } = await anonClient.rpc("has_role_in_church", {
      _user_id: callerId, _church_id: church_id, _role: "admin",
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: you must be an owner or admin of this church" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get church name for the email
    const { data: church } = await serviceClient
      .from("churches")
      .select("name")
      .eq("id", church_id)
      .single();

    const churchName = church?.name || "your church";

    // Find or create user
    let userId: string;

    const { data: listData } = await serviceClient.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Check if they already have this role
    const { data: existingRole } = await serviceClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("church_id", church_id)
      .eq("role", role)
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ error: "This person already has that role" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign role
    const { error: roleError } = await serviceClient
      .from("user_roles")
      .insert({ user_id: userId, church_id, role });
    if (roleError) throw roleError;

    // Ensure profile exists
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("church_id", church_id)
      .maybeSingle();

    if (!existingProfile) {
      const username = email.split("@")[0].replace(/[^a-z0-9]/gi, "") + Math.floor(Math.random() * 1000);
      await serviceClient.from("profiles").insert({
        user_id: userId,
        church_id,
        username,
        onboarding_complete: false,
      });
    }

    // Generate recovery link so they can set their password
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://faithbeyondsundays.lovable.app/admin/setup",
      },
    });

    if (linkError) throw linkError;

    const recoveryLink = linkData?.properties?.action_link || "https://faithbeyondsundays.lovable.app/admin/login";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

    // Send branded email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#c0d4e8 0%,#e8d5c4 38%,#dba84e 65%,#e09a00 100%);min-height:600px;">
    <tr><td align="center" style="padding:60px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">
        <!-- Icon -->
        <tr><td style="padding:36px 32px 0;text-align:center;">
          <div style="width:52px;height:52px;margin:0 auto;background:#fef3c7;border-radius:14px;line-height:52px;font-size:24px;">🤝</div>
        </td></tr>
        <!-- Title -->
        <tr><td style="padding:16px 32px 0;text-align:center;">
          <h1 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:700;">You're Invited!</h1>
        </td></tr>
        <tr><td style="padding:6px 32px 0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:14px;">Join the team on Faith Beyond Sundays</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            Hey! You've been invited to help manage <strong style="color:#1a1a2e;">${churchName}</strong> as a <strong style="color:#1a1a2e;">${roleLabel}</strong> on the Faith Beyond Sundays dashboard.
          </p>
          <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
            Click below to set up your account and get started.
          </p>
        </td></tr>
        <!-- CTA Button -->
        <tr><td style="padding:0 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:12px;background:#e09a00;text-align:center;"><a href="${recoveryLink}" target="_blank" style="display:block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Get Started</a></td></tr>
          </table>
        </td></tr>
        <!-- Fallback link -->
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${recoveryLink}" style="color:#e09a00;word-break:break-all;font-size:11px;">${recoveryLink}</a>
          </p>
        </td></tr>
      </table>
      <!-- Footer outside card -->
      <p style="margin:24px 0 0;color:rgba(255,255,255,0.7);font-size:12px;text-align:center;">Faith Beyond Sundays &bull; Empowering churches through technology</p>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Faith Beyond Sundays <notify@notify.faithbeyondsundays.app>",
        to: [email],
        subject: `You've been invited to manage ${churchName} on Faith Beyond Sundays`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend API error: ${resendRes.status} ${errBody}`);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("invite-church-admin error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
