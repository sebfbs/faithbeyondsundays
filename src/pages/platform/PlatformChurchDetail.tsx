import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, BookOpen, Hand, Smartphone, Loader2, Shield, Send, UserCog, ImagePlus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo, useState, useRef } from "react";

async function resizeLogo(file: File, targetSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(targetSize / img.width, targetSize / img.height);
      const x = (targetSize - img.width * scale) / 2;
      const y = (targetSize - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/png"
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

async function uploadChurchLogo(churchId: string, file: File) {
  const [blob192, blob512] = await Promise.all([resizeLogo(file, 192), resizeLogo(file, 512)]);
  const uploads = [
    supabase.storage.from("church-logos").upload(`${churchId}/original.png`, file, { upsert: true, contentType: "image/png" }),
    supabase.storage.from("church-logos").upload(`${churchId}/logo_192.png`, blob192, { upsert: true, contentType: "image/png" }),
    supabase.storage.from("church-logos").upload(`${churchId}/logo_512.png`, blob512, { upsert: true, contentType: "image/png" }),
  ];
  const results = await Promise.all(uploads);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  const pub = (path: string) => supabase.storage.from("church-logos").getPublicUrl(path).data.publicUrl;
  return {
    logo_url: pub(`${churchId}/original.png`),
    logo_192_url: pub(`${churchId}/logo_192.png`),
    logo_512_url: pub(`${churchId}/logo_512.png`),
  };
}
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    e.target.value = "";
    setUploadingLogo(true);
    try {
      const urls = await uploadChurchLogo(id, file);
      const { error } = await supabase.from("churches").update(urls).eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["platform", "church", id] });
      toast.success("Logo updated");
    } catch (err: any) {
      toast.error("Logo upload failed: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

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
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, username, avatar_url, created_at")
        .eq("church_id", id!);
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

      const [profileRes, emailRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, username")
          .eq("user_id", roleData.user_id)
          .eq("church_id", id!)
          .maybeSingle(),
        supabase.functions.invoke("get-user-email", {
          body: { user_id: roleData.user_id },
        }),
      ]);

      const profile = profileRes.data;
      const email = emailRes.data?.email ?? null;

      return {
        user_id: roleData.user_id,
        name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username : null,
        email,
      };
    },
    enabled: !!id,
  });

  // Fetch all roles for this church to show role badges on members
  const rolesQuery = useQuery({
    queryKey: ["platform", "church-roles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const church = churchQuery.data;
  const members = membersQuery.data ?? [];
  const sermonCount = sermonsQuery.data?.length ?? 0;
  const events = eventsQuery.data ?? [];
  const owner = ownerQuery.data;
  const roles = rolesQuery.data ?? [];

  const roleMap = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach((r) => {
      // Keep the highest role per user
      const priority: Record<string, number> = { owner: 5, admin: 4, pastor: 3, leader: 2, member: 1 };
      const existing = map[r.user_id];
      if (!existing || (priority[r.role] ?? 0) > (priority[existing] ?? 0)) {
        map[r.user_id] = r.role;
      }
    });
    return map;
  }, [roles]);

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
      queryClient.invalidateQueries({ queryKey: ["platform", "church-roles", id] });
      queryClient.invalidateQueries({ queryKey: ["platform", "church-members", id] });
    }
    setChangingAdmin(false);
  };

  const handleResendInvite = async () => {
    if (!id || !church) return;
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

  const roleBadgeColor: Record<string, string> = {
    owner: "bg-amber-500/20 text-amber-300",
    admin: "bg-violet-500/20 text-violet-300",
    pastor: "bg-blue-500/20 text-blue-300",
    leader: "bg-emerald-500/20 text-emerald-300",
    member: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200" onClick={() => navigate("/platform/churches")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        <button
          title="Upload logo"
          onClick={() => logoInputRef.current?.click()}
          className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-slate-500 transition-colors group shrink-0"
        >
          {church.logo_url ? (
            <>
              <img src={church.logo_url} alt={church.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="h-4 w-4 text-white" />
              </div>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-slate-400 group-hover:opacity-0 transition-opacity">
                {church.name.charAt(0).toUpperCase()}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="h-4 w-4 text-slate-300" />
              </div>
            </>
          )}
          {uploadingLogo && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </button>
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

      {/* Church Logo Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-sky-400" />
            Church Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Logo preview — always present */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
              {church.logo_url ? (
                <img src={church.logo_url} alt={church.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <ImagePlus className="h-7 w-7 text-slate-600" />
                  <span className="text-[10px] text-slate-600 font-medium">No logo</span>
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Info + actions — always present */}
            <div className="flex-1 space-y-3">
              <div>
                {church.logo_url ? (
                  <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    ✓ Logo uploaded
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    No logo uploaded
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                This logo appears as the app icon when members add {church.name} to their home screen.
              </p>
              <p className="text-xs text-slate-500">PNG, JPG, or SVG · Square recommended · Auto-resized to 192×192 and 512×512</p>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-200 bg-slate-800 hover:bg-slate-700"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {church.logo_url ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <p className="text-xs text-slate-400">{owner.email || `ID: ${owner.user_id.slice(0, 8)}…`}</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">No admin assigned</p>
              )}
            </div>
            <div className="flex gap-2">
              <Dialog open={changeAdminOpen} onOpenChange={setChangeAdminOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-500 text-slate-100 bg-slate-700 hover:bg-slate-600 hover:text-white">
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
                className="border-slate-500 text-slate-100 bg-slate-700 hover:bg-slate-600 hover:text-white"
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

      {/* Full Member List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            All Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Username</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((m) => {
                      const fullName = [m.first_name, m.last_name].filter(Boolean).join(" ");
                      const role = roleMap[m.user_id] || "member";
                      return (
                        <TableRow key={m.id} className="border-slate-800">
                          <TableCell className="text-slate-200 font-medium">
                            {fullName || "—"}
                          </TableCell>
                          <TableCell className="text-slate-400">@{m.username}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor[role] || roleBadgeColor.member}`}>
                              {role}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {format(new Date(m.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}