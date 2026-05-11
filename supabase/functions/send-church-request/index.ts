import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { church_name, requester_email, requester_name } = await req.json();

    if (!church_name?.trim() || !requester_email?.trim()) {
      return new Response(
        JSON.stringify({ error: "church_name and requester_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase.from("church_requests").insert({
      church_name: church_name.trim(),
      requester_email: requester_email.trim(),
      requester_name: requester_name?.trim() || null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw dbError;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Faith Beyond Sundays <noreply@faithbeyondsundays.com>",
          to: ["sebastian@faithbeyondsundays.com"],
          subject: `New Church Request: ${church_name.trim()}`,
          html: `
            <h2>New Church Request</h2>
            <p><strong>Church:</strong> ${church_name.trim()}</p>
            <p><strong>Requester Email:</strong> ${requester_email.trim()}</p>
            <p><strong>Requester Name:</strong> ${requester_name?.trim() || "—"}</p>
          `,
        }),
      });

      if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-church-request error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
