import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Church, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmedUsername)
      .neq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setError("That username is already taken. Please choose another.");
      setSubmitting(false);
      return;
    }

    // Update the profile
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

    toast.success("Profile set up successfully!");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="admin-root min-h-screen flex items-center justify-center gradient-horizon p-4">
      <Card className="w-full max-w-sm shadow-card border-border bg-card">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Church className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-card-foreground">Complete Your Profile</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your admin account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  maxLength={50}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-email">Email</Label>
              <Input
                id="setup-email"
                type="email"
                value={user?.email || ""}
                disabled
                className="opacity-60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                required
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                  maxLength={30}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
