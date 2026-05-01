import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Award, UserPlus, BookText, Heart, LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_COMMUNITY_PULSE } from "./demoData";
import { getBadgeTier } from "./badgeConfig";
import { useAccentColors } from "./themeColors";
import { formatDistanceToNow } from "date-fns";
import { getAvatarColor } from "./avatarColors";

interface CommunityPulseProps {
  churchId?: string;
  userId?: string;
  isDemo?: boolean;
  locked?: boolean;
  onNavigate?: (screen: string) => void;
}

interface PulseDataV2 {
  recent_reflectors: { first_name: string; avatar_url: string | null; reflected_at: string }[];
  recent_milestones: { first_name: string; avatar_url: string | null; milestone: number; earned_at: string }[];
  recent_members: { first_name: string; avatar_url: string | null; joined_at: string }[];
  recent_likes: { first_name: string; avatar_url: string | null; target_type: string; liked_at: string }[];
  active_avatars: { avatar_url: string | null; first_name: string }[];
}

interface Story {
  icon: LucideIcon;
  message: string;
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

const LOCKED_PULSE: PulseDataV2 = {
  recent_reflectors: [
    { first_name: "Marcus", avatar_url: null, reflected_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ],
  recent_milestones: [
    { first_name: "Sarah", avatar_url: null, milestone: 10, earned_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  ],
  recent_members: [
    { first_name: "Emily", avatar_url: null, joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  ],
  recent_likes: [
    { first_name: "James", avatar_url: null, target_type: "sermon", liked_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  ],
  active_avatars: [
    { avatar_url: null, first_name: "Sarah" },
    { avatar_url: null, first_name: "James" },
    { avatar_url: null, first_name: "Emily" },
  ],
};

function buildStories(pulse: PulseDataV2): Story[] {
  const stories: Story[] = [];

  for (const m of pulse.recent_milestones) {
    const tier = getBadgeTier(m.milestone);
    stories.push({
      icon: Award,
      message: `${m.first_name} earned their ${tier?.label || m.milestone + " Reflections"} badge!`,
    });
  }

  for (const r of pulse.recent_reflectors) {
    stories.push({
      icon: BookText,
      message: `${r.first_name} just reflected ${timeAgo(r.reflected_at)}`,
    });
  }

  for (const n of pulse.recent_members) {
    stories.push({
      icon: UserPlus,
      message: `${n.first_name} just joined the community`,
    });
  }

  for (const l of (pulse.recent_likes || [])) {
    stories.push({
      icon: Heart,
      message: l.target_type === "takeaway"
        ? `${l.first_name} liked a key takeaway`
        : `${l.first_name} liked this week's sermon`,
    });
  }

  return stories;
}

export default function CommunityPulse({ churchId, userId, isDemo, locked, onNavigate }: CommunityPulseProps) {
  const colors = useAccentColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const { data: pulse } = useQuery<PulseDataV2>({
    queryKey: ["community-pulse", churchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_community_pulse_v2" as any, {
        p_church_id: churchId!,
      });
      if (error) throw error;
      return data as unknown as PulseDataV2;
    },
    enabled: !isDemo && !locked && !!churchId && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const pulseData: PulseDataV2 | undefined = locked ? LOCKED_PULSE : isDemo ? DEMO_COMMUNITY_PULSE : pulse;

  const stories = useMemo(() => (pulseData ? buildStories(pulseData) : []), [pulseData]);
  const shouldRotate = stories.length >= 3;

  // Rotation timer
  useEffect(() => {
    if (!shouldRotate) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      setIsVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % stories.length);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [shouldRotate, stories.length]);

  // Reset index when stories change
  useEffect(() => {
    setActiveIndex(0);
    setIsVisible(true);
  }, [stories.length]);

  if (!pulseData || stories.length === 0) return null;

  const currentStory = stories[Math.min(activeIndex, stories.length - 1)];
  const Icon = currentStory.icon;
  const active_avatars = pulseData.active_avatars;

  return (
    <button
      onClick={() => !locked && onNavigate?.("community")}
      className={`bg-card w-full rounded-3xl p-5 shadow-card text-left transition-opacity ${locked ? "opacity-50 grayscale pointer-events-none" : "tap-active hover:opacity-90"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: colors.accentBg }}
        >
          <Users size={14} style={{ color: colors.accent }} />
        </div>
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
          Community Activity
        </span>
      </div>

      {/* Rotating message area */}
      <div
        className="flex items-center gap-2 transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <Icon size={14} className="text-muted-foreground shrink-0" />
        <p className="text-foreground font-medium text-sm leading-relaxed">{currentStory.message}</p>
      </div>

      {/* Active avatars */}
      {active_avatars && active_avatars.length > 0 && (
        <div className="flex items-center gap-1 mt-3">
          <div className="flex -space-x-2">
            {active_avatars.slice(0, 5).map((a, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: a.avatar_url ? "hsl(var(--muted))" : getAvatarColor(a.first_name || "?") }}
              >
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-white">
                    {a.first_name?.[0] || "?"}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">Active recently</span>
        </div>
      )}

      {locked && (
        <p className="text-xs text-muted-foreground mt-3 italic">Join a church to see your community</p>
      )}
    </button>
  );
}
