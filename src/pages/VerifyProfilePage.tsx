import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function VerifyProfilePage() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let done = false;

    const verify = async (userId: string) => {
      if (done) return;
      done = true;

      const { error } = await supabase
        .from("profiles")
        .update({ manually_verified: true } as any)
        .eq("user_id", userId);

      if (error) {
        console.error("Verify profile update error:", error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    };

    // Check if Supabase already exchanged the magic link token before we subscribed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) verify(session.user.id);
    });

    // Listen for the SIGNED_IN event fired when Supabase exchanges the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        verify(session.user.id);
      }
    });

    // If nothing happens within 10 seconds, the link is likely expired or missing
    const timeout = setTimeout(() => {
      if (!done) setStatus("error");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        background: "hsl(var(--background))",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {status === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Loader2 size={40} className="animate-spin" style={{ color: "#3B82F6" }} />
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 15 }}>Verifying your profile…</p>
        </div>
      )}

      {status === "success" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", maxWidth: 320 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
            }}
          >
            <BadgeCheck size={40} color="white" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: 22, margin: 0 }}>
              Profile Verified
            </p>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Your email has been confirmed. You can close this tab and return to the app — your Verified Profile badge is now unlocked.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", maxWidth: 320 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "hsl(var(--muted))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <XCircle size={40} style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: 22, margin: 0 }}>
              Link Expired
            </p>
            <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              This verification link has expired or is no longer valid. Go back to the app, open your Profile, and tap <strong>Verify Profile Now</strong> to get a fresh link.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
