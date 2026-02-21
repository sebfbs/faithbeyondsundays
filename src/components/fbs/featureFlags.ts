/**
 * Admin-controlled feature flags.
 * These determine which features are visible to church members.
 * In production, these values will come from the database
 * (set by the church admin in their dashboard).
 */
export const FEATURE_FLAGS: Record<string, boolean> = {
  community: true,
  prayer: true,
};
