import { useState, useMemo } from "react";
import { ArrowLeft, Users, Share2, Loader2, MessageCircle, ChevronRight, BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MEMBERS, markInviteSent, type CommunityMember } from "./communityData";
import { DEMO_GROUPS } from "./demoData";
import { useAccentColors } from "./themeColors";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import ChurchlessCommunity from "./ChurchlessCommunity";
import { getAvatarColor } from "./avatarColors";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

interface CommunityScreenProps {
  onBack: () => void;
  onViewProfile: (member: CommunityMember) => void;
  onGroups: () => void;
  userChurchCode: string;
  userChurchName: string;
  userChurchId?: string;
  isDemo?: boolean;
  onJoined?: () => void;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  hasUnread: boolean;
}

export default function CommunityScreen({
  onBack,
  onViewProfile,
  onGroups,
  userChurchCode,
  userChurchName,
  userChurchId,
  isDemo,
  onJoined,
}: CommunityScreenProps) {
  const colors = useAccentColors();
  const { user: authUser } = useAuth();
  const { blockedIds } = useBlockedUsers();

  // Fetch community groups
  const { data: groups = [] } = useQuery({
    queryKey: ["community-groups", userChurchCode],
    queryFn: async () => {
      // Fetch active groups for user's church
      let query = supabase
        .from("community_groups")
        .select("id, name, description")
        .eq("is_active", true);
      if (userChurchId) query = query.eq("church_id", userChurchId);
      const { data: groupRows, error } = await query;
      if (error) throw error;
      if (!groupRows?.length) return [] as GroupInfo[];

      const groupIds = groupRows.map((g) => g.id);

      // Fetch all memberships for these groups
      const { data: memberships } = await supabase
        .from("community_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      // Fetch latest message per group for unread indicator
      const { data: latestMessages } = await supabase
        .from("group_messages" as any)
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      // Build a map of group_id -> latest message time
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

        return {
          id: g.id,
          name: g.name,
          description: g.description,
          memberCount: members.length,
          isMember,
          hasUnread,
        } as GroupInfo;
      });
    },
    enabled: !isDemo && !!userChurchCode,
  });

  // Fetch real community members from DB
  const { data: realMembers = [], isLoading } = useQuery({
    queryKey: ["community-members", userChurchCode],
    queryFn: async () => {
      let profilesQuery = supabase
        .from("profiles_safe")
        .select("*, churches(name, code)");
      if (userChurchId) profilesQuery = profilesQuery.eq("church_id", userChurchId);
      const { data: profiles, error } = await profilesQuery;
      if (error) throw error;

      let rolesQuery = supabase
        .from("user_roles")
        .select("user_id, role");
      if (userChurchId) rolesQuery = rolesQuery.eq("church_id", userChurchId);
      const { data: roles } = await rolesQuery;
      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      const { data: badges } = await supabase
        .from("reflection_badges" as any)
        .select("user_id, milestone")
        .order("milestone", { ascending: false });
      const badgeMap = new Map<string, number>();
      (badges || []).forEach((b: any) => {
        if (!badgeMap.has(b.user_id)) badgeMap.set(b.user_id, b.milestone);
      });

      return (profiles || [])
        .filter((p) => p.user_id !== authUser?.id)
        .map((p) => ({
          username: p.username,
          firstName: p.first_name || "",
          lastName: p.last_name || "",
          churchName: (p.churches as any)?.name || "",
          churchCode: (p.churches as any)?.code || "",
          avatarUrl: p.avatar_url || undefined,
          memberSince: new Date(p.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          challengesCompleted: 0,
          isGroupMember: false,
          role: roleMap.get(p.user_id) === "pastor" ? ("pastor" as const) : undefined,
          instagramHandle: p.instagram_handle || undefined,
          reflectionMilestone: badgeMap.get(p.user_id),
          userId: p.user_id,
          manually_verified: (p as any).manually_verified ?? false,
        })) as CommunityMember[];
    },
    enabled: !isDemo && !!userChurchCode,
  });

  const allMembers = isDemo ? DEMO_MEMBERS : realMembers;

  const churchMembers = useMemo(() => {
    const filtered = isDemo
      ? allMembers.filter((m) => m.churchCode === userChurchCode)
      : allMembers;
    return filtered
      .filter((m) => !m.userId || !blockedIds.includes(m.userId))
      .sort((a, b) => {
        if (a.role === "pastor") return -1;
        if (b.role === "pastor") return 1;
        return 0;
      });
  }, [allMembers, userChurchCode, isDemo, blockedIds]);

  const handleInvite = async () => {
    const shareData = {
      title: `Join ${userChurchName}`,
      text: `Join me on the ${userChurchName} app! Download it and stay connected with our church family.`,
      url: "https://faithbeyondsundays.app",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        markInviteSent();
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        markInviteSent();
        toast({ title: "Invite link copied!", description: "Share it with a friend." });
      }
    } catch (e) {
      // User cancelled share sheet
    }
  };

  if (!userChurchCode) {
    return <ChurchlessCommunity onBack={onBack} onViewProfile={onViewProfile} onJoined={onJoined} />;
  }

  return (
    <div
      className="px-5 pb-6 space-y-5 animate-fade-in"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Community</h1>
      </div>

      {/* Groups entry point */}
      <button
        onClick={onGroups}
        className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow text-left"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: colors.accentBg }}
        >
          <MessageCircle size={19} style={{ color: colors.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Groups</p>
          <p className="text-xs text-muted-foreground">
            {(isDemo ? DEMO_GROUPS : groups).length} group{(isDemo ? DEMO_GROUPS : groups).length !== 1 ? "s" : ""} · Browse &amp; join
          </p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
      </button>

      {/* Section label */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Church Members
      </p>

      {/* Loading state */}
      {!isDemo && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Member list */}
      {(!isLoading || isDemo) && (
        <div className="space-y-2">
          {churchMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No other members yet — invite someone!
            </p>
          )}
          {churchMembers.map((member) => (
            <button
              key={member.username}
              onClick={() => onViewProfile(member)}
              className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow text-left"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: member.avatarUrl ? "hsl(var(--muted))" : getAvatarColor(member.username) }}
              >
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{member.username}
                  {member.manually_verified && (
                    <BadgeCheck size={13} className="inline ml-0.5 relative -top-px text-blue-500" />
                  )}
                  {member.role === "pastor" && (
                    <span
                      className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: "hsl(38, 100%, 47%, 0.12)",
                        color: "hsl(38, 100%, 47%)",
                      }}
                    >
                      Pastor
                    </span>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Invite a Friend */}
      {(!isLoading || isDemo) && (
        <button
          onClick={handleInvite}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(170 55% 45% / 0.12)" }}
          >
            <Share2 size={19} style={{ color: "hsl(170, 55%, 45%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Don't see your friend?</p>
            <p className="text-xs text-muted-foreground">Invite them to join {userChurchName}</p>
          </div>
        </button>
      )}

    </div>
  );
}
