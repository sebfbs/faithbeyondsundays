import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, Loader2, CheckCircle2, Send, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PlatformChurches() {
  const { churches, members, loading } = usePlatformAnalytics();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", state: "", adminEmail: "" });

  // Success state after creation
  const [createdChurch, setCreatedChurch] = useState<{ id: string; name: string; adminEmail: string } | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const memberCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.church_id] = (acc[m.church_id] || 0) + 1;
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const code = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: churchData, error } = await supabase.from("churches").insert({
      name: form.name,
      code,
      city: form.city || null,
      state: form.state || null,
    }).select("id").single();

    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }

    // Assign admin if email provided
    if (form.adminEmail) {
      const { error: assignError } = await supabase.functions.invoke("assign-church-admin", {
        body: { church_id: churchData.id, admin_email: form.adminEmail },
      });
      if (assignError) {
        toast.error("Church created but failed to assign admin: " + assignError.message);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["platform", "churches"] });
    setCreating(false);

    if (form.adminEmail) {
      setCreatedChurch({ id: churchData.id, name: form.name, adminEmail: form.adminEmail });
    } else {
      toast.success("Church created");
      resetDialog();
    }
  };

  const handleSendInvite = async () => {
    if (!createdChurch) return;
    setSendingInvite(true);
    const { error } = await supabase.functions.invoke("send-admin-invite", {
      body: {
        church_id: createdChurch.id,
        church_name: createdChurch.name,
        admin_email: createdChurch.adminEmail,
      },
    });
    if (error) {
      toast.error("Failed to send invite: " + error.message);
    } else {
      toast.success("Invite email sent!");
      setInviteSent(true);
    }
    setSendingInvite(false);
  };

  const resetDialog = () => {
    setOpen(false);
    setForm({ name: "", city: "", state: "", adminEmail: "" });
    setCreatedChurch(null);
    setInviteSent(false);
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    const { error } = await supabase.from("churches").update({ is_active: !currentlyActive }).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["platform", "churches"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== "delete") return;
    setDeleting(true);
    const { error } = await supabase.from("churches").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success(`"${deleteTarget.name}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["platform", "churches"] });
      queryClient.invalidateQueries({ queryKey: ["platform", "members"] });
    }
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Churches</h1>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Church
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            {createdChurch ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Church Created!</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{createdChurch.name}</p>
                      <p className="text-xs text-slate-400">Admin: {createdChurch.adminEmail}</p>
                    </div>
                  </div>
                  {!inviteSent ? (
                    <Button onClick={handleSendInvite} disabled={sendingInvite} className="w-full">
                      {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Send Admin Invite Email
                    </Button>
                  ) : (
                    <div className="text-center text-sm text-emerald-400">✓ Invite email sent</div>
                  )}
                  <Button variant="ghost" className="w-full text-slate-400" onClick={resetDialog}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-slate-100">Create Church Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-slate-800 border-slate-700 text-slate-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300">City</Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">State</Label>
                      <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Admin Email</Label>
                    <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@church.com" className="bg-slate-800 border-slate-700 text-slate-100" />
                    <p className="text-xs text-slate-500">The admin will receive an invite to manage this church.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Church
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400 text-right">Members</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {churches.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-slate-800 cursor-pointer hover:bg-slate-800/50"
                  onClick={() => navigate(`/platform/churches/${c.id}`)}
                >
                  <TableCell className="font-medium text-slate-200">{c.name}</TableCell>
                  <TableCell className="text-slate-400">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</TableCell>
                  <TableCell className="text-right text-slate-300">{memberCounts[c.id] || 0}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "bg-emerald-500/15 text-emerald-400 border-0" : "bg-slate-700 text-slate-400 border-0"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-200"
                        onClick={() => toggleActive(c.id, c.is_active)}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {churches.length === 0 && (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No churches yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) { setDeleteTarget(null); setDeleteConfirm(""); } }}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">Delete Church Account</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete <span className="font-semibold text-slate-200">{deleteTarget?.name}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-slate-300 text-sm">Type <span className="font-mono font-semibold text-red-400">delete</span> to confirm</Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toLowerCase())}
              placeholder="delete"
              className="bg-slate-800 border-slate-700 text-slate-100"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "delete" || deleting}
              onClick={handleDelete}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
