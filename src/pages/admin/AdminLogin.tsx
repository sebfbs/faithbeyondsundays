import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, AlertCircle, Loader2 } from "lucide-react";
import fbsLogo from "@/assets/FBS_Logo_white_2.png";

export default function AdminLogin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    checkAccess(user.id);
  }, [user, authLoading]);

  const checkAccess = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role, church_id")
      .eq("user_id", userId)
      .in("role", ["owner", "admin", "pastor"]);

    if (roles && roles.length > 0) {
      navigate("/admin", { replace: true });
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
