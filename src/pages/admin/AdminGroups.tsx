import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Users2, Pencil, Trash2, ToggleLeft } from "lucide-react";
import { toast } from "sonner";

const FEATURE_KEYS = [
  { key: "community", label: "Community", description: "Member directory and social features" },
  { key: "prayer", label: "Prayer", description: "Prayer request submission and viewing" },
  { key: "giving", label: "Giving", description: "Giving/donation link in the app" },
];

export default function AdminGroups() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Groups query
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["admin", "groups", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_groups")
        .select("*, community_group_members(id)")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((g: any) => ({
        ...g,
        memberCount: g.community_group_members?.length ?? 0,
      }));
    },
  });

  // Feature flags query
  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: ["admin", "feature-flags", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("church_feature_flags")
        .select("*")
        .eq("church_id", churchId);
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((f: any) => {
        map[f.feature_key] = f.enabled;
      });
      return map;
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("church_feature_flags")
        .upsert(
          { church_id: churchId, feature_key: key, enabled },
          { onConflict: "church_id,feature_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
      toast.success("Feature flag updated");
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingGroup) {
        const { error } = await supabase
          .from("community_groups")
          .update({ name, description: description || null })
          .eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("community_groups")
          .insert({
            name,
            description: description || null,
            church_id: churchId,
            created_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
      toast.success(editingGroup ? "Group updated" : "Group created");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
      toast.success("Group deleted");
    },
  });

  const toggleGroupActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("community_groups")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
      toast.success("Group updated");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingGroup(null);
  };

  const openEdit = (group: any) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    setDialogOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Feature Flags */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ToggleLeft className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Feature Flags</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Toggle which features are visible to your members.
        </p>
        {flagsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-3">
            {FEATURE_KEYS.map((f) => {
              const enabled = featureFlags?.[f.key] ?? true;
              return (
                <Card key={f.key} className="shadow-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        toggleFlag.mutate({ key: f.key, enabled: checked })
                      }
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Community Groups</h2>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editingGroup ? "Edit Group" : "Create Group"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createGroup.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createGroup.isPending}>
                  {createGroup.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingGroup ? "Save Changes" : "Create Group"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {groupsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !groups?.length ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Users2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No community groups yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {groups.map((group: any) => (
              <Card key={group.id} className="shadow-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{group.name}</p>
                      {!group.is_active && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {group.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={group.is_active}
                      onCheckedChange={(checked) =>
                        toggleGroupActive.mutate({ id: group.id, is_active: checked })
                      }
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(group)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteGroup.mutate(group.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
