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

    const callerId = claimsData.claims.sub;
    const { data: isAdmin } = await anonClient.rpc("is_platform_admin", { _user_id: callerId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { church_id, church_name, admin_email } = await req.json();
    if (!church_id || !church_name || !admin_email) {
      return new Response(JSON.stringify({ error: "church_id, church_name, and admin_email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate recovery link so admin can set their password
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email: admin_email,
      options: {
        redirectTo: "https://faithbeyondsundays.lovable.app/admin/set-password",
      },
    });

    if (linkError) throw linkError;

    const recoveryLink = linkData?.properties?.action_link || "https://faithbeyondsundays.lovable.app/admin/login";

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
          <div style="width:52px;height:52px;margin:0 auto;background:#fef3c7;border-radius:14px;line-height:52px;font-size:24px;">🏛</div>
        </td></tr>
        <!-- Title -->
        <tr><td style="padding:16px 32px 0;text-align:center;">
          <h1 style="margin:0;color:#1a1a2e;font-size:22px;font-weight:700;">Church Admin</h1>
        </td></tr>
        <tr><td style="padding:6px 32px 0;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:14px;">Manage your church on Faith Beyond Sundays</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
            You've been set up as the admin for <strong style="color:#1a1a2e;">${church_name}</strong>.
          </p>
          <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
            Click below to set your password and access your dashboard.
          </p>
        </td></tr>
        <!-- CTA Button -->
        <tr><td style="padding:0 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:12px;background:#e09a00;text-align:center;"><a href="${recoveryLink}" target="_blank" style="display:block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Set Password & Sign In</a></td></tr>
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
        from: "Sebastian <sebastian@welcome.faithbeyondsundays.com>",
        to: [admin_email],
        subject: `You've been invited to manage ${church_name} on Faith Beyond Sundays`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Resend API error: ${resendRes.status} ${errBody}`);
    }

    const resendData = await resendRes.json();

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-admin-invite error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
