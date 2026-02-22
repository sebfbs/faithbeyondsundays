import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, BookOpen, Hand, Smartphone, Loader2, Shield, Send, UserCog } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

export default function PlatformChurchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [changeAdminOpen, setChangeAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [changingAdmin, setChangingAdmin] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const churchQuery = useQuery({
    queryKey: ["platform", "church", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("churches").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: ["platform", "church-members", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, created_at").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const sermonsQuery = useQuery({
    queryKey: ["platform", "church-sermons", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("id").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: ["platform", "church-events", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events").select("id, event_type, created_at").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch church owner from user_roles
  const ownerQuery = useQuery({
    queryKey: ["platform", "church-owner", id],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("church_id", id!)
        .eq("role", "owner")
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleData) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, username")
        .eq("user_id", roleData.user_id)
        .eq("church_id", id!)
        .maybeSingle();

      // We can't directly get the email from profiles, so we'll show what we have
      return {
        user_id: roleData.user_id,
        name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username : null,
      };
    },
    enabled: !!id,
  });

  const church = churchQuery.data;
  const members = membersQuery.data ?? [];
  const sermonCount = sermonsQuery.data?.length ?? 0;
  const events = eventsQuery.data ?? [];
  const owner = ownerQuery.data;

  const giveTaps = events.filter((e) => e.event_type === "give_tap").length;
  const appOpens = events.filter((e) => e.event_type === "app_open").length;

  const memberChart = useMemo(() => {
    const days = 30;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      buckets[format(subDays(new Date(), i), "MMM d")] = 0;
    }
    members.forEach((m) => {
      const key = format(new Date(m.created_at), "MMM d");
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [members]);

  const handleChangeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newAdminEmail) return;
    setChangingAdmin(true);
    const { error } = await supabase.functions.invoke("assign-church-admin", {
      body: { church_id: id, admin_email: newAdminEmail },
    });
    if (error) {
      toast.error("Failed to assign admin: " + error.message);
    } else {
      toast.success("Admin assigned successfully");
      setChangeAdminOpen(false);
      setNewAdminEmail("");
      queryClient.invalidateQueries({ queryKey: ["platform", "church-owner", id] });
    }
    setChangingAdmin(false);
  };

  const handleResendInvite = async () => {
    if (!id || !church) return;
    // We need the admin email — prompt if we don't have it
    const email = prompt("Enter the admin's email to resend the invite:");
    if (!email) return;
    setSendingInvite(true);
    const { error } = await supabase.functions.invoke("send-admin-invite", {
      body: { church_id: id, church_name: church.name, admin_email: email },
    });
    if (error) {
      toast.error("Failed to send invite: " + error.message);
    } else {
      toast.success("Invite email sent!");
    }
    setSendingInvite(false);
  };

  const loading = churchQuery.isLoading || membersQuery.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Church not found.</p>
        <Button variant="ghost" className="mt-4 text-slate-300" onClick={() => navigate("/platform/churches")}>
          Back to churches
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Members", value: members.length, icon: Users, color: "text-emerald-400" },
    { label: "Sermons", value: sermonCount, icon: BookOpen, color: "text-violet-400" },
    { label: "Give Taps", value: giveTaps, icon: Hand, color: "text-amber-400" },
    { label: "App Opens", value: appOpens, icon: Smartphone, color: "text-cyan-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200" onClick={() => navigate("/platform/churches")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{church.name}</h1>
          <p className="text-sm text-slate-400">{[church.city, church.state].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Church Admin Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            Church Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {owner ? (
                <>
                  <p className="text-sm font-medium text-slate-200">{owner.name || "Name not set"}</p>
                  <p className="text-xs text-slate-500">User ID: {owner.user_id.slice(0, 8)}…</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">No admin assigned</p>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog open={changeAdminOpen} onOpenChange={setChangeAdminOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-slate-100">
                    <UserCog className="h-3.5 w-3.5 mr-1.5" />
                    {owner ? "Change" : "Assign"} Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">{owner ? "Change" : "Assign"} Church Admin</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangeAdmin} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Admin Email</Label>
                      <Input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        required
                        placeholder="admin@church.com"
                        className="bg-slate-800 border-slate-700 text-slate-100"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={changingAdmin}>
                      {changingAdmin && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Assign Admin
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:text-slate-100"
                onClick={handleResendInvite}
                disabled={sendingInvite}
              >
                {sendingInvite ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Resend Invite
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">New Members — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memberChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 22%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 22%)", borderRadius: 8, color: "hsl(40 30% 95%)" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(160 60% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
