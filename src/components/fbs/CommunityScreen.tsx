import { useState, useMemo } from "react";
import { ArrowLeft, Search, Church, Users, Share2, Loader2, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MEMBERS, getFollows, markInviteSent, type CommunityMember } from "./communityData";
import { DEMO_GROUPS } from "./demoData";
import { getAccentColors } from "./themeColors";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import ChurchlessCommunity from "./ChurchlessCommunity";
import GroupDetailSheet from "./GroupDetailSheet";
import { getAvatarColor } from "./avatarColors";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

interface CommunityScreenProps {
  onBack: () => void;
  onViewProfile: (member: CommunityMember) => void;
  userChurchCode: string;
  userChurchName: string;
  userChurchId?: string;
  isDemo?: boolean;
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
  userChurchCode,
  userChurchName,
  userChurchId,
  isDemo,
}: CommunityScreenProps) {
  const [search, setSearch] = useState("");
  const colors = getAccentColors();
  const follows = getFollows();
  const { user: authUser } = useAuth();
  const { blockedIds } = useBlockedUsers();
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  const [demoMemberships, setDemoMemberships] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    DEMO_GROUPS.forEach((g) => { init[g.id] = g.isMember; });
    return init;
  });

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

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const source = isDemo ? DEMO_MEMBERS : allMembers;
    return source.filter(
      (m) =>
        (!m.userId || !blockedIds.includes(m.userId)) &&
        (m.username.includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q))
    );
  }, [search, isDemo, allMembers, blockedIds]);

  const displayList = searchResults ?? churchMembers;
  const isSearching = searchResults !== null;

  const handleInvite = async () => {
    const shareData = {
      title: "Join Faith Beyond Sundays",
      text: "Join me on Faith Beyond Sundays! Download the app and start growing in your faith.",
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
    return <ChurchlessCommunity onBack={onBack} onViewProfile={onViewProfile} />;
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

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or @username"
          className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>

      {/* Invite a Friend */}
      {!isSearching && (
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
            <p className="text-sm font-semibold text-foreground">Invite a friend</p>
            <p className="text-xs text-muted-foreground">Invite a friend & earn a badge</p>
          </div>
        </button>
      )}

      {/* Your church label */}
      {!isSearching && (
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Your Church
        </p>
      )}

      {/* Church header */}
      {!isSearching && (
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: colors.accentBg }}
            >
              <Church size={22} style={{ color: colors.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{userChurchName}</p>
              <p className="text-xs text-muted-foreground">
                {churchMembers.length >= 15
                  ? `${churchMembers.length} member${churchMembers.length !== 1 ? "s" : ""}`
                  : "Your church family"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Groups section */}
      {!isSearching && (isDemo ? DEMO_GROUPS : groups).length > 0 && (
        <>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Groups
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
            {(isDemo ? DEMO_GROUPS.map(g => ({ ...g, isMember: demoMemberships[g.id] ?? g.isMember })) : groups).map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g)}
                className="min-w-[160px] max-w-[200px] bg-card rounded-2xl p-4 shadow-card tap-active hover:shadow-card-hover transition-shadow text-left shrink-0 relative"
              >
                {g.hasUnread && (
                  <div
                    className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                    style={{ background: colors.accent }}
                  />
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                  style={{ background: colors.accentBg }}
                >
                  <MessageCircle size={18} style={{ color: colors.accent }} />
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {g.memberCount} member{g.memberCount !== 1 ? "s" : ""}
                </p>
                {g.isMember && (
                  <div
                    className="mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: colors.accentBg, color: colors.accent }}
                  >
                    Joined
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Section label */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {isSearching
          ? `${displayList.length} result${displayList.length !== 1 ? "s" : ""}`
          : "Church Members"}
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
          {displayList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isSearching ? "No members found" : "No other members yet — invite someone!"}
            </p>
          )}
          {displayList.map((member) => (
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
                  {isSearching && isDemo && (
                    <span className="ml-1.5 text-muted-foreground/70">· {member.churchName}</span>
                  )}
                </p>
              </div>
              {follows.includes(member.username) && (
                <div
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                  style={{ background: colors.accentBg, color: colors.accent }}
                >
                  Following
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Group detail sheet */}
      {selectedGroup && (
        <GroupDetailSheet
          open={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
          isMember={selectedGroup.isMember}
          memberCount={selectedGroup.memberCount}
          isDemo={isDemo}
          churchId={userChurchId}
          onMembershipChange={(isMember) => {
            if (isDemo) {
              setDemoMemberships((prev) => ({ ...prev, [selectedGroup.id]: isMember }));
            }
            setSelectedGroup((prev) => prev ? { ...prev, isMember } : null);
          }}
        />
      )}
    </div>
  );
}
