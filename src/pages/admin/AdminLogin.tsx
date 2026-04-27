import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Track whether the current session was initiated from this login page
  const [loginAttempted, setLoginAttempted] = useState(() => {
    // If returning from OAuth redirect, the URL hash will contain access_token
    const hash = window.location.hash;
    return hash.includes("access_token");
  });

  useEffect(() => {
    if (authLoading || !user) return;

    // If the URL contains a recovery token, redirect to the reset-password page
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("type=magiclink")) {
      navigate("/admin/reset-password", { replace: true });
      return;
    }

    // Only check access if the user explicitly logged in from this page
    if (loginAttempted) {
      checkAccess(user.id);
    }
  }, [user, authLoading, loginAttempted]);

  const checkAccess = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role, church_id")
      .eq("user_id", userId)
      .in("role", ["owner", "admin", "pastor"]);

    if (roles && roles.length > 0) {
      const churchId = roles[0].church_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, onboarding_complete")
        .eq("user_id", userId)
        .eq("church_id", churchId)
        .maybeSingle();

      if (profile && (!profile.first_name || !profile.onboarding_complete)) {
        navigate("/admin/setup", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } else {
      setAccessDenied(true);
      setSubmitting(false);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setAccessDenied(false);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      setLoginAttempted(true);
      await checkAccess(data.user.id);
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    setAccessDenied(false);

    setLoginAttempted(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/admin/login" },
    });

    if (oauthError) {
      setError(oauthError.message || "Google sign-in failed");
      setGoogleLoading(false);
      setLoginAttempted(false);
    }
    // On success, the page will redirect and useEffect will handle access check
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above, then click Forgot Password.");
      return;
    }
    setError("");
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setError("");
      alert("Check your email for a password reset link.");
    }
  };

  if (authLoading) {
    return (
      <div className="admin-root min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="admin-root min-h-screen flex items-center justify-center gradient-horizon p-4">
      <Card className="w-full max-w-sm shadow-card border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Church className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-card-foreground">Church Admin</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your church on Faith Beyond Sundays
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessDenied ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-card-foreground">Access Denied</p>
              <p className="text-xs text-muted-foreground">
                Your account does not have church admin privileges. Contact your church administrator.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setAccessDenied(false); navigate("/"); }}
              >
                Back to App
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={googleLoading || submitting}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting || googleLoading}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
