import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- APNs JWT signing (ES256) ---

async function createApnsJwt(): Promise<string> {
  const teamId = Deno.env.get("APNS_TEAM_ID")!;
  const keyId = Deno.env.get("APNS_KEY_ID")!;
  const privateKeyPem = Deno.env.get("APNS_PRIVATE_KEY")!;

  // Parse the PEM key
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const keyData = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signingInput
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// --- Send to APNs ---

async function sendApns(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  bundleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const jwt = await createApnsJwt();
    const isProduction = Deno.env.get("APNS_PRODUCTION") === "true";
    const host = isProduction
      ? "https://api.push.apple.com"
      : "https://api.sandbox.push.apple.com";

    const payload = {
      aps: {
        alert: { title, body },
        sound: "default",
        badge: 1,
      },
      ...data,
    };

    const response = await fetch(`${host}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { success: false, error: `APNs ${response.status}: ${errBody}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// --- Send to FCM (Android) ---

async function sendFcm(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  const fcmKey = Deno.env.get("FCM_SERVER_KEY");
  if (!fcmKey) return { success: false, error: "FCM_SERVER_KEY not configured" };

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${fcmKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body, sound: "default" },
        data,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { success: false, error: `FCM ${response.status}: ${errBody}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authenticate the caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub as string;

    const {
      church_id,
      user_ids,
      notification_type,
      title,
      body,
      data = {},
    }: {
      church_id: string;
      user_ids: string[];
      notification_type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    } = await req.json();

    if (!church_id || !user_ids?.length || !notification_type || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: church_id, user_ids, notification_type, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Authorize: caller must be admin/pastor/owner in this church ---
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("church_id", church_id)
      .in("role", ["owner", "admin", "pastor"]);

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: you must be an admin, pastor, or owner of this church" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Verify all targeted users belong to this church ---
    const { data: validProfiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("church_id", church_id)
      .in("user_id", user_ids);

    const validUserIds = (validProfiles || []).map((p) => p.user_id);
    if (validUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid users found in this church" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bundleId =
      Deno.env.get("APNS_BUNDLE_ID") || "app.lovable.67349056f3e74b9d8798250401b58caa";

    // Check user preferences — skip users who disabled this notification type
    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("user_id, enabled")
      .in("user_id", validUserIds)
      .eq("notification_type", notification_type);

    const disabledUsers = new Set(
      (prefs || []).filter((p) => !p.enabled).map((p) => p.user_id)
    );

    const eligibleUserIds = validUserIds.filter((id) => !disabledUsers.has(id));

    if (eligibleUserIds.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: validUserIds.length, message: "All users have this notification disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get device tokens for eligible users
    const { data: tokens } = await supabaseAdmin
      .from("device_tokens")
      .select("user_id, token, platform")
      .in("user_id", eligibleUserIds);

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No device tokens found for eligible users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to each device
    const results = await Promise.allSettled(
      tokens.map(async (device) => {
        let result: { success: boolean; error?: string };

        if (device.platform === "ios") {
          result = await sendApns(device.token, title, body, data, bundleId);
        } else if (device.platform === "android") {
          result = await sendFcm(device.token, title, body, data);
        } else {
          result = { success: false, error: `Unsupported platform: ${device.platform}` };
        }

        // Log the notification
        await supabaseAdmin.from("notification_log").insert({
          user_id: device.user_id,
          notification_type,
          title,
          body,
          data,
          status: result.success ? "sent" : "failed",
          error_message: result.error || null,
        });

        return { ...result, user_id: device.user_id, platform: device.platform };
      })
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - sent;

    return new Response(
      JSON.stringify({ sent, failed, skipped: validUserIds.length - eligibleUserIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
