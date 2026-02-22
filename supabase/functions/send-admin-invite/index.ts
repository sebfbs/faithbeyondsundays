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
        redirectTo: "https://faithbeyondsundays.lovable.app/admin/login",
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
<body style="margin:0;padding:0;background-color:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1117;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#1a1d29;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px 32px 24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Faith Beyond Sundays</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#f5f0e8;font-size:20px;font-weight:600;">You're Invited!</h2>
          <p style="margin:0 0 20px;color:#9ca3af;font-size:15px;line-height:1.6;">
            You've been set up as the admin for <strong style="color:#f5f0e8;">${church_name}</strong> on Faith Beyond Sundays.
          </p>
          <p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.6;">
            Click the button below to set your password and access your church admin dashboard.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="border-radius:10px;background:#d97706;"><a href="${recoveryLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Set Password & Sign In</a></td></tr>
          </table>
          <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.5;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${recoveryLink}" style="color:#d97706;word-break:break-all;">${recoveryLink}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2d3a;text-align:center;">
          <p style="margin:0;color:#4b5563;font-size:12px;">Faith Beyond Sundays &bull; Empowering churches through technology</p>
        </td></tr>
      </table>
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
        from: "Sebastian <sebastian@faithbeyondsundays.com>",
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
