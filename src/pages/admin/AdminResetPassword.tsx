import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: pwError } = await supabase.auth.updateUser({ password });

    if (pwError) {
      const msg = pwError.message.toLowerCase();
      if (msg.includes("weak") || msg.includes("easy to guess") || msg.includes("leaked") || msg.includes("compromised")) {
        setError("That password is too common — try adding a random word or number to make it more unique.");
      } else {
        setError(pwError.message);
      }
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    toast({ title: "Password updated", description: "You can now sign in with your new password." });

    setTimeout(() => navigate("/admin/login", { replace: true }), 2000);
  };

  return (
    <div className="admin-root min-h-screen flex items-center justify-center gradient-horizon p-4">
      <Card className="w-full max-w-sm shadow-card border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {success ? (
              <CheckCircle className="h-6 w-6 text-primary" />
            ) : (
              <Church className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl text-card-foreground">
            {success ? "Password Updated" : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {success
              ? "Redirecting you to sign in…"
              : "Create a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? null : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
