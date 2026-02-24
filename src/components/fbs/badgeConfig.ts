/**
 * Badge tier definitions for reflection milestones.
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
