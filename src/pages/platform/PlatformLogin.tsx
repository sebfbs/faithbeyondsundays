import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

export default function PlatformLogin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // If already logged in, check platform admin status
  useEffect(() => {
    if (authLoading || !user) return;
    checkAccess(user.id);
  }, [user, authLoading]);

  const checkAccess = async (userId: string) => {
    const { data } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      navigate("/platform/dashboard", { replace: true });
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
      await checkAccess(data.user.id);
    }
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="platform-root min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="platform-root min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-sm border-slate-800 bg-slate-900 shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-slate-100">Platform Admin</CardTitle>
          <CardDescription className="text-slate-400">
            Faith Beyond Sundays — Owner Access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessDenied ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-slate-300">Access Denied</p>
              <p className="text-xs text-slate-500">Your account does not have platform admin privileges.</p>
              <Button variant="outline" className="w-full border-slate-700 text-slate-300" onClick={() => { setAccessDenied(false); navigate("/"); }}>
                Back to App
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
