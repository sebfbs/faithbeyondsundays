import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function AdminSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If arriving via a recovery link, redirect to reset-password page
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      navigate("/admin/reset-password", { replace: true });
    }
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
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
    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);

    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters (letters, numbers, underscores).");
      setSubmitting(false);
      return;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmedUsername)
      .neq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setError("That username is already taken. Try another.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        username: trimmedUsername,
        onboarding_complete: true,
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#e09a00", "#f5c542", "#38bdf8", "#ffffff"],
    });

    toast.success("You're all set!");
    setTimeout(() => navigate("/admin", { replace: true }), 1200);
  };

  const displayUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "yourname";

  // Progress dots
  const ProgressDots = () => (
    <div className="flex justify-center gap-2 mb-5">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: s === step ? 24 : 8,
            background: s <= step ? "hsl(38, 100%, 47%)" : "hsl(220, 15%, 90%)",
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="admin-root min-h-screen flex items-center justify-center p-4 transition-all duration-700"
      style={{
        background: step === 3
          ? undefined
          : "var(--gradient-horizon)",
      }}
    >
      {/* Animated aurora background for step 3 */}
      {step === 3 && (
        <div className="fixed inset-0 animate-aurora-bg" aria-hidden="true" />
      )}

      <div className="relative z-10 w-full max-w-sm">
        {/* Step 1 */}
        {step === 1 && (
          <Card className="w-full shadow-card border-border bg-card animate-fade-in">
            <CardHeader className="text-center space-y-3">
              <ProgressDots />
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Church className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-card-foreground">Welcome!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Let's get you set up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required maxLength={50} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required maxLength={50} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Continue</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="w-full shadow-card border-border bg-card animate-fade-in">
            <CardHeader className="text-center space-y-3">
              <ProgressDots />
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Church className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-card-foreground">Contact & Security</CardTitle>
              <CardDescription className="text-muted-foreground">
                How can people reach you?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-email">Email</Label>
                  <Input id="setup-email" type="email" value={user?.email || ""} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" required maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3 -- Claim Your Username */}
        {step === 3 && (
          <Card className="w-full bg-card/95 backdrop-blur-sm border-0 animate-fade-in animate-shimmer-border shadow-xl">
            <CardHeader className="text-center space-y-3 pt-6">
              <ProgressDots />
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-sky-400 flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-card-foreground font-bold tracking-tight">
                Claim Your @
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Every great name is still available. Pick yours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Live username preview */}
              <div className="flex justify-center">
                <span
                  className="text-3xl font-bold tracking-tight transition-all duration-300 bg-gradient-to-r from-amber-500 to-sky-500 bg-clip-text text-transparent"
                  style={{ transform: username.trim() ? "scale(1.05)" : "scale(1)" }}
                >
                  @{displayUsername}
                </span>
              </div>

              <form onSubmit={handleStep3} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="sr-only">Username</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">@</span>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="yourname"
                      required
                      maxLength={30}
                      className="pl-9 text-lg font-semibold h-12"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Letters, numbers, and underscores only</p>
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-amber" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Claim @{displayUsername}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
