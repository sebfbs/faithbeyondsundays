import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PlatformChurches() {
  const { churches, members, loading } = usePlatformAnalytics();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", state: "" });

  const memberCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.church_id] = (acc[m.church_id] || 0) + 1;
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.from("churches").insert({
      name: form.name,
      code: form.code.toLowerCase().replace(/\s+/g, "-"),
      city: form.city || null,
      state: form.state || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Church created");
      setOpen(false);
      setForm({ name: "", code: "", city: "", state: "" });
      queryClient.invalidateQueries({ queryKey: ["platform", "churches"] });
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    const { error } = await supabase.from("churches").update({ is_active: !currentlyActive }).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["platform", "churches"] });
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Church
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Create Church Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Code *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="e.g. grace-nyc" className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" />
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
              <Button type="submit" className="w-full" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Church
              </Button>
            </form>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      onClick={() => toggleActive(c.id, c.is_active)}
                    >
                      {c.is_active ? "Deactivate" : "Activate"}
                    </Button>
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
    </div>
  );
}
