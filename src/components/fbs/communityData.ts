/**
 * Demo data for the community feature.
 * In production, this comes from the database.
 */

export interface CommunityMember {
  username: string;
  firstName: string;
  lastName: string;
  churchName: string;
  churchCode: string;
  avatarUrl?: string;
  memberSince: string;
  challengesCompleted: number;
  isGroupMember: boolean;
  hasInvited?: boolean;
  role?: "pastor";
  instagramHandle?: string;
  userId?: string;
}

export const DEMO_MEMBERS: CommunityMember[] = [
  {
    username: "pastor_james",
    firstName: "James",
    lastName: "Whitfield",
    churchName: "Cornerstone Community Church",
    churchCode: "cornerstone",
    memberSince: "Sep 2024",
    challengesCompleted: 24,
    isGroupMember: true,
    hasInvited: true,
    role: "pastor",
    instagramHandle: "pastor_james",
  },
  {
    username: "sarah_m",
    firstName: "Sarah",
    lastName: "Mitchell",
    churchName: "Cornerstone Community Church",
    churchCode: "cornerstone",
    memberSince: "Nov 2024",
    challengesCompleted: 12,
    isGroupMember: true,
    instagramHandle: "sarah.mitchell",
  },
  {
    username: "david.chen",
    firstName: "David",
    lastName: "Chen",
    churchName: "Cornerstone Community Church",
    churchCode: "cornerstone",
    memberSince: "Jan 2025",
    challengesCompleted: 7,
    isGroupMember: false,
  },
  {
    username: "grace_obi",
    firstName: "Grace",
    lastName: "Obi",
    churchName: "Cornerstone Community Church",
    churchCode: "cornerstone",
    memberSince: "Dec 2024",
    challengesCompleted: 15,
    isGroupMember: true,
    hasInvited: true,
  },
  {
    username: "marcus_j",
    firstName: "Marcus",
    lastName: "Johnson",
    churchName: "Cornerstone Community Church",
    churchCode: "cornerstone",
    memberSince: "Feb 2025",
    challengesCompleted: 3,
    isGroupMember: false,
  },
  {
    username: "linda_w",
    firstName: "Linda",
    lastName: "Washington",
    churchName: "Grace Fellowship",
    churchCode: "grace",
    memberSince: "Oct 2024",
    challengesCompleted: 18,
    isGroupMember: true,
  },
  {
    username: "eli_torres",
    firstName: "Eli",
    lastName: "Torres",
    churchName: "Grace Fellowship",
    churchCode: "grace",
    memberSince: "Jan 2025",
    challengesCompleted: 9,
    isGroupMember: false,
  },
  {
    username: "joy_ada",
    firstName: "Joy",
    lastName: "Adamu",
    churchName: "Faith Chapel",
    churchCode: "faith",
    memberSince: "Nov 2024",
    challengesCompleted: 21,
    isGroupMember: true,
    hasInvited: true,
  },
  {
    username: "ben_k",
    firstName: "Benjamin",
    lastName: "Kim",
    churchName: "Faith Chapel",
    churchCode: "faith",
    memberSince: "Mar 2025",
    challengesCompleted: 2,
    isGroupMember: false,
  },
];

/** Get all taken usernames from demo data */
export function isUsernameTaken(username: string): boolean {
  return DEMO_MEMBERS.some((m) => m.username === username.toLowerCase());
}

/** Validate username format */
export function validateUsername(username: string): string | null {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be 20 characters or less";
  if (!/^[a-z0-9_]+$/.test(username)) return "Only lowercase letters, numbers, and underscores";
  if (isUsernameTaken(username)) return "Username is already taken";
  return null;
}

// --- Follow system (localStorage-backed, used for demo mode) ---

const FOLLOWS_KEY = "fbs_follows";

export function getFollows(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setFollows(follows: string[]) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows));
}

export function toggleFollow(username: string): string[] {
  const current = getFollows();
  const next = current.includes(username)
    ? current.filter((u) => u !== username)
    : [...current, username];
  setFollows(next);
  return next;
}

export function isFollowing(username: string): boolean {
  return getFollows().includes(username);
}

// --- DB-backed follow system (used in real/auth mode) ---

import { supabase } from "@/integrations/supabase/client";

export async function followUserDb(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("follows").insert({ follower_id: user.id, following_id: followingId });
}

export async function unfollowUserDb(followingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followingId);
}

export async function isFollowingDb(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { count } = await supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id).eq("following_id", followingId);
  return (count ?? 0) > 0;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId);
  return count ?? 0;
}

export interface FollowListUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export async function getFollowersList(userId: string): Promise<FollowListUser[]> {
  const { data } = await supabase
    .from("follows")
    .select("follower_id, profiles!follows_follower_id_fkey(user_id, username, first_name, last_name, avatar_url)")
    .eq("following_id", userId);

  return (data || []).map((row: any) => {
    const p = row.profiles;
    return { userId: p?.user_id || row.follower_id, username: p?.username || "", firstName: p?.first_name || "", lastName: p?.last_name || "", avatarUrl: p?.avatar_url || undefined };
  });
}

export async function getFollowingList(userId: string): Promise<FollowListUser[]> {
  const { data } = await supabase
    .from("follows")
    .select("following_id, profiles!follows_following_id_fkey(user_id, username, first_name, last_name, avatar_url)")
    .eq("follower_id", userId);

  return (data || []).map((row: any) => {
    const p = row.profiles;
    return { userId: p?.user_id || row.following_id, username: p?.username || "", firstName: p?.first_name || "", lastName: p?.last_name || "", avatarUrl: p?.avatar_url || undefined };
  });
}

// --- Invite system (localStorage-backed) ---

const INVITED_KEY = "fbs_has_invited";

export function markInviteSent() {
  localStorage.setItem(INVITED_KEY, "true");
}

export function hasInvited(): boolean {
  return localStorage.getItem(INVITED_KEY) === "true";
}
