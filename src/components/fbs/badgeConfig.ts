/**
 * Badge tier definitions — reflection milestones and all other badge types.
 * Single source of truth for labels, colors, and animated gradients.
 */

export interface BadgeTier {
  milestone: number;
  label: string;
  detail: string;
  color?: string;
  gradient?: string;
  animated: boolean;
}

export const BADGE_TIERS: BadgeTier[] = [
  { milestone: 1, label: "First Reflection", detail: "Daily Journaler", color: "hsl(340, 70%, 55%)", animated: false },
  { milestone: 5, label: "5 Reflections", detail: "Getting Started", color: "hsl(207, 65%, 55%)", animated: false },
  { milestone: 10, label: "10 Reflections", detail: "Consistent", color: "hsl(150, 55%, 45%)", animated: false },
  { milestone: 25, label: "25 Reflections", detail: "Dedicated", color: "hsl(38, 100%, 47%)", animated: false },
  { milestone: 50, label: "50 Reflections", detail: "Committed", color: "hsl(280, 60%, 55%)", animated: false },
  {
    milestone: 100,
    label: "100 Reflections",
    detail: "Centurion",
    gradient: "linear-gradient(135deg, hsl(15, 85%, 55%), hsl(340, 70%, 55%), hsl(15, 85%, 55%))",
    animated: true,
  },
  {
    milestone: 200,
    label: "200 Reflections",
    detail: "Devoted",
    gradient: "linear-gradient(135deg, hsl(195, 80%, 45%), hsl(170, 70%, 50%), hsl(195, 80%, 45%))",
    animated: true,
  },
  {
    milestone: 500,
    label: "500 Reflections",
    detail: "Pillar",
    gradient: "linear-gradient(135deg, hsl(350, 75%, 50%), hsl(320, 65%, 45%), hsl(350, 75%, 50%))",
    animated: true,
  },
  {
    milestone: 1000,
    label: "1,000 Reflections",
    detail: "Legend",
    gradient: "linear-gradient(135deg, hsl(45, 100%, 50%), hsl(30, 90%, 50%), hsl(45, 100%, 50%))",
    animated: true,
  },
  {
    milestone: 2000,
    label: "2,000 Reflections",
    detail: "Eternal",
    gradient: "linear-gradient(135deg, hsl(260, 70%, 45%), hsl(280, 65%, 55%), hsl(260, 70%, 45%))",
    animated: true,
  },
];

/**
 * Returns the badge tier config for a given milestone number.
 * Returns undefined if the milestone doesn't match any tier.
 */
export function getBadgeTier(milestone: number): BadgeTier | undefined {
  return BADGE_TIERS.find((t) => t.milestone === milestone);
}

/**
 * Returns the highest badge tier at or below the given count.
 * Returns undefined if count is 0.
 */
export function getHighestBadge(count: number): BadgeTier | undefined {
  if (count <= 0) return undefined;
  const eligible = BADGE_TIERS.filter((t) => t.milestone <= count);
  return eligible.length > 0 ? eligible[eligible.length - 1] : undefined;
}

// ─── Non-reflection badge types ───────────────────────────────────────────────

export type UserBadgeType =
  | "founding_member"
  | "group_member"
  | "streak_3" | "streak_7" | "streak_30" | "streak_100"
  | "scripture_1" | "scripture_10" | "scripture_50" | "scripture_100";

export type UserBadgeGroup = "special" | "streak" | "scripture";

export interface UserBadgeConfig {
  type: UserBadgeType;
  label: string;
  detail: string;
  color?: string;
  gradient?: string;
  animated?: boolean;
  group: UserBadgeGroup;
}

export const USER_BADGE_CONFIGS: UserBadgeConfig[] = [
  // Special
  { type: "founding_member", label: "Founding Member", detail: "One of the first 250", gradient: "linear-gradient(135deg, hsl(208,80%,78%), hsl(248,72%,76%), hsl(288,70%,76%), hsl(328,72%,76%), hsl(18,78%,76%), hsl(208,80%,78%))", animated: true, group: "special" },
  { type: "group_member",    label: "Group Member",    detail: "Community Connected",  gradient: "linear-gradient(135deg, hsl(174,58%,48%), hsl(192,55%,53%), hsl(174,58%,48%))", group: "special" },
  // Streaks
  { type: "streak_3",   label: "3-Day Streak",   detail: "On Fire",        color: "hsl(26, 88%, 57%)", group: "streak" },
  { type: "streak_7",   label: "7-Day Streak",   detail: "Week Warrior",   color: "hsl(16, 82%, 53%)", group: "streak" },
  { type: "streak_30",  label: "30-Day Streak",  detail: "Month of Faith", gradient: "linear-gradient(135deg, hsl(12,78%,53%), hsl(352,72%,51%), hsl(12,78%,53%))", group: "streak" },
  { type: "streak_100", label: "100-Day Streak", detail: "Unstoppable",    gradient: "linear-gradient(135deg, hsl(355,72%,48%), hsl(20,82%,56%), hsl(355,72%,48%))", group: "streak" },
  // Scripture
  { type: "scripture_1",   label: "First Chapter", detail: "Scripture Reader",  color: "hsl(214, 65%, 57%)", group: "scripture" },
  { type: "scripture_10",  label: "10 Chapters",   detail: "Scripture Student", color: "hsl(228, 62%, 55%)", group: "scripture" },
  { type: "scripture_50",  label: "50 Chapters",   detail: "Deep Diver",        gradient: "linear-gradient(135deg, hsl(242,65%,53%), hsl(215,68%,58%), hsl(242,65%,53%))", group: "scripture" },
  { type: "scripture_100", label: "100 Chapters",  detail: "Word of God",       gradient: "linear-gradient(135deg, hsl(258,68%,46%), hsl(282,62%,57%), hsl(258,68%,46%))", group: "scripture" },
];

export function getUserBadgeConfig(type: string): UserBadgeConfig | undefined {
  return USER_BADGE_CONFIGS.find((c) => c.type === type);
}
