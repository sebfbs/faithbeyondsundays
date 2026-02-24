import { useState, useMemo } from "react";
import { ArrowLeft, Search, Church, Users, Share2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MEMBERS, getFollows, markInviteSent, type CommunityMember } from "./communityData";
import { getAccentColors } from "./themeColors";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import ChurchlessCommunity from "./ChurchlessCommunity";

interface CommunityScreenProps {
  onBack: () => void;
  onViewProfile: (member: CommunityMember) => void;
  userChurchCode: string;
  userChurchName: string;
  isDemo?: boolean;
}

export default function CommunityScreen({
  onBack,
  onViewProfile,
  userChurchCode,
  userChurchName,
  isDemo,
}: CommunityScreenProps) {
  const [search, setSearch] = useState("");
  const colors = getAccentColors();
  const follows = getFollows();
  const { user: authUser } = useAuth();

  // Fetch real community members from DB
  const { data: realMembers = [], isLoading } = useQuery({
    queryKey: ["community-members", userChurchCode],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*, churches(name, code)");
      if (error) throw error;

      // Fetch roles visible in this church (RLS filters to same church)
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");
      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      // Fetch highest reflection badge per user
      const { data: badges } = await supabase
        .from("reflection_badges" as any)
        .select("user_id, milestone")
        .order("milestone", { ascending: false });
      const badgeMap = new Map<string, number>();
      (badges || []).forEach((b: any) => {
        if (!badgeMap.has(b.user_id)) badgeMap.set(b.user_id, b.milestone);
      });

      return (profiles || [])
        .filter((p) => p.user_id !== authUser?.id) // exclude self
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

  const churchMembers = useMemo(
    () => {
      const filtered = isDemo
        ? allMembers.filter((m) => m.churchCode === userChurchCode)
        : allMembers; // Real data already filtered by RLS
      return filtered.sort((a, b) => {
        if (a.role === "pastor") return -1;
        if (b.role === "pastor") return 1;
        return 0;
      });
    },
    [allMembers, userChurchCode, isDemo]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const source = isDemo ? DEMO_MEMBERS : allMembers;
    return source.filter(
      (m) =>
        m.username.includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
    );
  }, [search, isDemo, allMembers]);

  const displayList = searchResults ?? churchMembers;
  const isSearching = searchResults !== null;

  const handleInvite = async () => {
    const shareData = {
      title: "Join Faith Beyond Sundays",
      text: `Join me on Faith Beyond Sundays! Use church code '${userChurchCode}' to connect with ${userChurchName}.`,
      url: "https://faithbeyondsundays.lovable.app",
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

  // Churchless experience — full search UI
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
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or @username"
          className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>

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
              <p className="text-sm font-bold text-foreground truncate">
                {userChurchName}
              </p>
              <p className="text-xs text-muted-foreground">
                {churchMembers.length >= 15
                  ? `${churchMembers.length} member${churchMembers.length !== 1 ? "s" : ""}`
                  : "Your church family"}
              </p>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-xs text-muted-foreground">Share your church code & earn a badge</p>
          </div>
        </button>
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
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: "hsl(var(--muted))" }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </span>
                )}
              </div>
              {/* Info */}
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
                    <span className="ml-1.5 text-muted-foreground/70">
                      · {member.churchName}
                    </span>
                  )}
                </p>
              </div>
              {/* Following indicator */}
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
    </div>
  );
}
