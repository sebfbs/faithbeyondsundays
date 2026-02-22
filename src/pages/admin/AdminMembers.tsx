import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-blue-100 text-blue-700",
  pastor: "bg-violet-100 text-violet-700",
  leader: "bg-emerald-100 text-emerald-700",
  member: "bg-muted text-muted-foreground",
};

export default function AdminMembers() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin", "members", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, username, avatar_url, created_at")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch roles for all members
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("church_id", churchId)
        .in("user_id", userIds);

      const roleMap: Record<string, string> = {};
      (roles ?? []).forEach((r) => {
        // Keep highest priority role
        const priority = ["owner", "admin", "pastor", "leader", "member"];
        if (!roleMap[r.user_id] || priority.indexOf(r.role) < priority.indexOf(roleMap[r.user_id])) {
          roleMap[r.user_id] = r.role;
        }
      });

      return profiles.map((p) => ({
        ...p,
        role: roleMap[p.user_id] || "member",
        displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username,
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      // Delete existing role for this church, then insert new one
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("church_id", churchId);

      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        church_id: churchId,
        role: newRole as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const filtered = (members ?? []).filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {members?.length ?? 0} members in your church
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !filtered.length ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search ? "No members match your search." : "No members yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((member) => (
            <Card key={member.id} className="shadow-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{member.username}</p>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(val) =>
                    updateRole.mutate({ userId: member.user_id, newRole: val })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
