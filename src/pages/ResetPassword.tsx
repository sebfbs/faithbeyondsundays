import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHasRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  if (!hasRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "hsl(var(--background))" }}>
        <div className="text-center max-w-[320px]">
          <p className="text-sm text-muted-foreground mb-4">Loading recovery session…</p>
          <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "hsl(var(--background))" }}>
        <div className="text-center max-w-[320px]">
          <div className="w-16 h-16 rounded-full bg-amber/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-amber" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Password Updated</h1>
          <p className="text-sm text-muted-foreground">Redirecting you now…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-[400px] space-y-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Set New Password</h1>
        <p className="text-sm text-muted-foreground mb-4">Choose a new password for your account.</p>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-card rounded-2xl px-4 py-4 pr-12 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
        />

        <p className="text-xs text-muted-foreground ml-1">At least 6 characters</p>

        {error && <p className="text-xs text-destructive ml-1">{error}</p>}

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          Update Password
        </button>
      </div>
    </div>
  );
}