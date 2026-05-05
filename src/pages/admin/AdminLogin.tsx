import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, AlertCircle, Loader2 } from "lucide-react";
import { getSkyGradient } from "@/components/fbs/HomeTab";

export default function AdminLogin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

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
    <div className="admin-root min-h-screen flex items-center justify-center p-4" style={{ background: getSkyGradient() }}>
      <Card className="w-full max-w-sm shadow-card border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Church className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-card-foreground">Church Admin</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your church
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
                <Button type="submit" className="w-full" disabled={submitting}>
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
