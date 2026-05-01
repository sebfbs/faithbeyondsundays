import { useState, useEffect } from "react";
import { ChevronLeft, Users, MessageCircle, LogIn, LogOut, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useAccentColors } from "./themeColors";
import { getAvatarColor } from "./avatarColors";
import { DEMO_GROUP_MEMBERS } from "./demoData";
import GroupChat from "./GroupChat";

interface GroupPageProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    isMember: boolean;
  };
  onBack: () => void;
  isDemo?: boolean;
  churchId?: string;
  onMembershipChange?: (isMember: boolean) => void;
  onViewProfile?: (userId: string) => void;
}

export default function GroupPage({ group, onBack, isDemo, churchId, onMembershipChange, onViewProfile }: GroupPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colors = useAccentColors();
  const [view, setView] = useState<"landing" | "chat">("landing");
  const [demoMember, setDemoMember] = useState(group.isMember);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => setViewportHeight(vv.height);
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

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
    enabled: !isDemo,
  });

  const demoMembers = isDemo ? (DEMO_GROUP_MEMBERS[group.id] || []) : [];
  const displayMembers = isDemo ? demoMembers : members;
  const isMember = isDemo ? demoMember : (members.some((m) => m.userId === user?.id) || group.isMember);
  const memberCount = isDemo ? demoMembers.length : (members.length || group.memberCount);

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
      onMembershipChange?.(true);
    },
  });

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
      onMembershipChange?.(false);
    },
  });

  const isActing = joinMutation.isPending || leaveMutation.isPending;

  const handleJoinLeave = () => {
    if (isDemo) {
      const next = !demoMember;
      setDemoMember(next);
      onMembershipChange?.(next);
      return;
    }
    isMember ? leaveMutation.mutate() : joinMutation.mutate();
  };

  // ── Chat view ──────────────────────────────────────────────────
  if (view === "chat") {
    return (
      <div
        className="flex flex-col"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: viewportHeight ? `${viewportHeight}px` : "100dvh",
          background: "hsl(var(--background))",
          zIndex: 60,
        }}
      >
        {/* Sticky header — always visible at top */}
        <div
          className="flex-shrink-0 px-5 pb-3 flex items-center gap-3 border-b border-border bg-background"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
        >
          <button
            onClick={() => setView("landing")}
            className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground truncate">{group.name}</p>
            <p className="text-xs text-muted-foreground">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {/* GroupChat fills remaining space */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          <GroupChat groupId={group.id} isMember={isMember} isDemo={isDemo} churchId={churchId} onViewProfile={onViewProfile} />
        </div>
      </div>
    );
  }

  // ── Landing view ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div
        className="px-5 pb-4 flex items-center gap-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground truncate">{group.name}</h1>
      </div>

      <div className="px-5 pb-10 space-y-4">
        {/* Group info card */}
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: colors.accentBg }}
            >
              <MessageCircle size={26} style={{ color: colors.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground">{group.name}</p>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{group.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <Users size={11} className="inline mr-1" />
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Join button — only shown when not a member */}
          {!isMember && (
            <button
              onClick={handleJoinLeave}
              disabled={isActing}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-colors tap-active disabled:opacity-50"
              style={{ background: colors.accent, color: "white" }}
            >
              {isActing ? <Loader2 size={15} className="animate-spin" /> : <><LogIn size={15} /> Join Group</>}
            </button>
          )}
        </div>

        {/* Open Chat — only if member */}
        {isMember && (
          <button
            onClick={() => setView("chat")}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl tap-active transition-colors"
            style={{ background: colors.accent }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={20} color="white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Open Chat</p>
              <p className="text-xs text-white/70">Chat with your group</p>
            </div>
            <ChevronLeft size={16} color="white" className="rotate-180 shrink-0" />
          </button>
        )}

        {/* Members section */}
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Members</p>

          {membersLoading && !isDemo && (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!membersLoading && displayMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No members yet — be the first to join!
            </p>
          )}

          <div className="space-y-1">
            {displayMembers.map((m) => (
              <button key={m.userId} className="w-full flex items-center gap-3 p-2 rounded-xl tap-active" onClick={() => onViewProfile?.(m.userId)} disabled={!onViewProfile}>
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
                  <p className="text-xs text-muted-foreground truncate">@{m.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Leave Group — tucked at the bottom, only if member */}
        {isMember && (
          <button
            onClick={handleJoinLeave}
            disabled={isActing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold tap-active disabled:opacity-50"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            {isActing ? <Loader2 size={15} className="animate-spin" /> : <><LogOut size={15} /> Leave Group</>}
          </button>
        )}
      </div>
    </div>
  );
}
