import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Users, MessageCircle, LogIn, LogOut, Loader2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { getAccentColors } from "./themeColors";
import GroupChat from "./GroupChat";
import { getAvatarColor } from "./avatarColors";

interface GroupDetailSheetProps {
  open: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description: string | null;
  };
  isMember: boolean;
  memberCount: number;
  isDemo?: boolean;
}

export default function GroupDetailSheet({
  open,
  onClose,
  group,
  isMember: initialIsMember,
  memberCount: initialMemberCount,
  isDemo,
}: GroupDetailSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colors = getAccentColors();
  const [tab, setTab] = useState<"members" | "chat">("chat");

  // Fetch group members with profiles
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["group-members", group.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_group_members")
        .select("user_id, joined_at")
        .eq("group_id", group.id);
      if (error) throw error;
      const userIds = (data || []).map((m) => m.user_id);
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles_safe")
        .select("user_id, first_name, last_name, avatar_url, username")
        .in("user_id", userIds);

      return (profiles || []).map((p) => ({
        userId: p.user_id,
        firstName: p.first_name || "",
        lastName: p.last_name || "",
        username: p.username,
        avatarUrl: p.avatar_url,
      }));
    },
    enabled: open && !isDemo,
  });

  const isMember = members.some((m) => m.userId === user?.id) || initialIsMember;
  const memberCount = members.length || initialMemberCount;

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_group_members")
        .insert({ group_id: group.id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", group.id] });
      queryClient.invalidateQueries({ queryKey: ["community-groups"] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", group.id] });
      queryClient.invalidateQueries({ queryKey: ["community-groups"] });
    },
  });

  const isActing = joinMutation.isPending || leaveMutation.isPending;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh] flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground truncate pr-4">
              {group.name}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => {
                if (isDemo) {
                  onClose();
                  return;
                }
                isMember ? leaveMutation.mutate() : joinMutation.mutate();
              }}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                isMember
                  ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  : { background: colors.accent, color: "white" }
              }
            >
              {isActing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isMember ? (
                <>
                  <LogOut size={12} /> Leave
                </>
              ) : (
                <>
                  <LogIn size={12} /> Join
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-muted rounded-xl p-1">
            {(["chat", "members"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {t === "chat" ? <MessageCircle size={13} /> : <Users size={13} />}
                {t === "chat" ? "Chat" : "Members"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {tab === "chat" ? (
            <GroupChat groupId={group.id} isMember={isMember} isDemo={isDemo} />
          ) : (
            <div className="overflow-y-auto px-4 py-3 space-y-1">
              {membersLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              )}
              {!membersLoading && members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members yet — be the first to join!
                </p>
              )}
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 p-3 rounded-xl"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: m.avatarUrl ? "hsl(var(--muted))" : getAvatarColor(m.username || "") }}
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {m.firstName[0]}{m.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{m.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
