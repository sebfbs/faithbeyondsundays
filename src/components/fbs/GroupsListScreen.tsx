import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { DEMO_GROUPS } from "./demoData";
import GroupPage from "./GroupPage";
import { getAccentColors } from "./themeColors";

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  hasUnread: boolean;
}

interface GroupsListScreenProps {
  onBack: () => void;
  userChurchCode: string;
  userChurchId?: string;
  isDemo?: boolean;
  onViewProfile?: (userId: string) => void;
}

export default function GroupsListScreen({ onBack, userChurchCode, userChurchId, isDemo, onViewProfile }: GroupsListScreenProps) {
  const { user: authUser } = useAuth();
  const colors = getAccentColors();
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  const [demoMemberships, setDemoMemberships] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DEMO_GROUPS.forEach((g) => { init[g.id] = g.isMember; });
    return init;
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["community-groups", userChurchCode],
    queryFn: async () => {
      let query = supabase
        .from("community_groups")
        .select("id, name, description")
        .eq("is_active", true);
      if (userChurchId) query = query.eq("church_id", userChurchId);
      const { data: groupRows, error } = await query;
      if (error) throw error;
      if (!groupRows?.length) return [] as GroupInfo[];

      const groupIds = groupRows.map((g) => g.id);

      const { data: memberships } = await supabase
        .from("community_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      const { data: latestMessages } = await supabase
        .from("group_messages" as any)
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      const latestMsgMap = new Map<string, string>();
      (latestMessages || []).forEach((m: any) => {
        if (!latestMsgMap.has(m.group_id)) latestMsgMap.set(m.group_id, m.created_at);
      });

      return groupRows.map((g) => {
        const members = (memberships || []).filter((m) => m.group_id === g.id);
        const isMember = members.some((m) => m.user_id === authUser?.id);
        const lastMsg = latestMsgMap.get(g.id);
        const lastRead = localStorage.getItem(`group-chat-read-${g.id}`);
        const hasUnread = isMember && !!lastMsg && (!lastRead || lastMsg > lastRead);
        return { id: g.id, name: g.name, description: g.description, memberCount: members.length, isMember, hasUnread } as GroupInfo;
      });
    },
    enabled: !isDemo && !!userChurchCode,
  });

  const displayGroups = isDemo
    ? DEMO_GROUPS.map((g) => ({ ...g, isMember: demoMemberships[g.id] ?? g.isMember }))
    : groups;

  if (selectedGroup) {
    return (
      <GroupPage
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        isDemo={isDemo}
        churchId={userChurchId}
        onViewProfile={onViewProfile}
        onMembershipChange={(isMember) => {
          if (isDemo) {
            setDemoMemberships((prev) => ({ ...prev, [selectedGroup.id]: isMember }));
          }
          setSelectedGroup((prev) => prev ? { ...prev, isMember } : null);
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="px-5 pb-2 flex items-center gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">
            {displayGroups.length} group{displayGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-8 space-y-3">
        {/* Loading */}
        {isLoading && !isDemo && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayGroups.length === 0 && (
          <div className="bg-card rounded-3xl p-8 shadow-card text-center">
            <p className="text-sm text-muted-foreground">No groups yet. Check back soon.</p>
          </div>
        )}

        {/* Group cards */}
        {displayGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g)}
            className="w-full bg-card rounded-3xl p-5 shadow-card tap-active hover:shadow-card-hover transition-shadow text-left relative"
          >
            {g.hasUnread && (
              <div
                className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
                style={{ background: colors.accent }}
              />
            )}
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: colors.accentBg }}
              >
                <MessageCircle size={22} style={{ color: colors.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground truncate">{g.name}</p>
                {g.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {g.isMember && (
                  <div
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: colors.accentBg, color: colors.accent }}
                  >
                    Joined
                  </div>
                )}
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}
