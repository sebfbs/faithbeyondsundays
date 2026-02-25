import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Shield, Crown, BookOpen } from "lucide-react";
import { format } from "date-fns";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
};

const roleBadgeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Crown }> = {
  owner: { label: "Owner", variant: "default", icon: Crown },
  admin: { label: "Admin", variant: "secondary", icon: Shield },
  pastor: { label: "Pastor", variant: "outline", icon: BookOpen },
};

export default function AdminTeam() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "pastor">("admin");
  const [inviting, setInviting] = useState(false);
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);

    // Get all owner/admin/pastor roles for this church
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .eq("church_id", churchId)
      .in("role", ["owner", "admin", "pastor"])
      .order("created_at", { ascending: true });

    if (error || !roles) {
      setLoading(false);
      return;
    }

    // Get profiles for these users
    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .eq("church_id", churchId)
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Fetch emails via edge function
    const emailMap = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const { data } = await supabase.functions.invoke("get-user-email", {
            body: { user_id: uid },
          });
          if (data?.email) emailMap.set(uid, data.email);
        } catch {}
      })
    );

    const teamMembers: TeamMember[] = roles.map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        ...r,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        email: emailMap.get(r.user_id),
      };
    });

    setMembers(teamMembers);

    // Determine caller's role
    const callerRoleRow = roles.find((r) => r.user_id === user?.id);
    setCallerRole(callerRoleRow?.role || null);

    setLoading(false);
  };

  useEffect(() => {
    if (churchId) fetchTeam();
  }, [churchId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("invite-church-admin", {
        body: { church_id: churchId, email: inviteEmail.trim(), role: inviteRole },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Invite failed", description: data.error, variant: "destructive" });
        setInviting(false);
        return;
      }

      toast({ title: "Invite sent!", description: `An invite email has been sent to ${inviteEmail}.` });
      setInviteEmail("");
      setInviteOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    }
    setInviting(false);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", removeTarget.id);

      if (error) throw error;

      toast({ title: "Removed", description: `${removeTarget.first_name || removeTarget.email || "Team member"} has been removed.` });
      setRemoveTarget(null);
      fetchTeam();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    }
    setRemoving(false);
  };

  const canInvite = callerRole === "owner" || callerRole === "admin";
  const canRemove = callerRole === "owner";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who has access to the admin dashboard
          </p>
        </div>

        {canInvite && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  They'll receive an email with a link to set up their account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "pastor")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Both Admins and Pastors have full dashboard access. Admins can also invite other team members.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team list */}
      <div className="border border-border rounded-lg divide-y divide-border bg-card">
        {members.map((member) => {
          const config = roleBadgeConfig[member.role] || roleBadgeConfig.admin;
          const Icon = config.icon;
          const displayName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Pending setup";
          const isCurrentUser = member.user_id === user?.id;

          return (
            <div key={member.id} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayName}
                      {isCurrentUser && <span className="text-muted-foreground font-normal"> (you)</span>}
                    </p>
                    <Badge variant={config.variant} className="text-[11px] shrink-0">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email || "—"} · Joined {format(new Date(member.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {canRemove && member.role !== "owner" && !isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveTarget(member)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No team members found.
          </div>
        )}
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <strong>{removeTarget?.first_name || removeTarget?.email || "this person"}</strong>'s{" "}
              {removeTarget?.role} access to the dashboard. They can be re-invited later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={removing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
