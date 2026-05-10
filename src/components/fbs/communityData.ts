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
  manually_verified?: boolean;
  reflectionMilestone?: number;
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
    hasInvited: true,
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
  // --- 30 additional Cornerstone members ---
  { username: "rachel_h", firstName: "Rachel", lastName: "Henderson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Oct 2024", challengesCompleted: 18, isGroupMember: true, hasInvited: true },
  { username: "mike_p", firstName: "Michael", lastName: "Patterson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 9, isGroupMember: false },
  { username: "angela_r", firstName: "Angela", lastName: "Rivera", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Dec 2024", challengesCompleted: 14, isGroupMember: true },
  { username: "joshua_b", firstName: "Joshua", lastName: "Brooks", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Jan 2025", challengesCompleted: 6, isGroupMember: false },
  { username: "faith_n", firstName: "Faith", lastName: "Nwosu", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Sep 2024", challengesCompleted: 22, isGroupMember: true, hasInvited: true },
  { username: "tyler_k", firstName: "Tyler", lastName: "Kim", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Feb 2025", challengesCompleted: 1, isGroupMember: false },
  { username: "naomi_w", firstName: "Naomi", lastName: "Williams", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Oct 2024", challengesCompleted: 16, isGroupMember: true },
  { username: "caleb_s", firstName: "Caleb", lastName: "Stewart", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 11, isGroupMember: false },
  { username: "priya_d", firstName: "Priya", lastName: "Desai", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Dec 2024", challengesCompleted: 8, isGroupMember: true },
  { username: "ethan_l", firstName: "Ethan", lastName: "Lewis", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Jan 2025", challengesCompleted: 4, isGroupMember: false },
  { username: "maya_t", firstName: "Maya", lastName: "Thompson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Oct 2024", challengesCompleted: 20, isGroupMember: true, hasInvited: true },
  { username: "daniel_g", firstName: "Daniel", lastName: "Garcia", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 5, isGroupMember: false },
  { username: "abigail_c", firstName: "Abigail", lastName: "Clark", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Sep 2024", challengesCompleted: 19, isGroupMember: true },
  { username: "isaiah_m", firstName: "Isaiah", lastName: "Moore", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Feb 2025", challengesCompleted: 2, isGroupMember: false },
  { username: "olivia_j", firstName: "Olivia", lastName: "Jackson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Dec 2024", challengesCompleted: 13, isGroupMember: true },
  { username: "noah_a", firstName: "Noah", lastName: "Anderson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Jan 2025", challengesCompleted: 7, isGroupMember: false },
  { username: "chloe_b", firstName: "Chloe", lastName: "Brown", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 10, isGroupMember: true },
  { username: "liam_h", firstName: "Liam", lastName: "Harris", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Oct 2024", challengesCompleted: 17, isGroupMember: false, hasInvited: true },
  { username: "zoe_f", firstName: "Zoe", lastName: "Foster", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Sep 2024", challengesCompleted: 21, isGroupMember: true },
  { username: "jordan_w", firstName: "Jordan", lastName: "Walker", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Dec 2024", challengesCompleted: 6, isGroupMember: false },
  { username: "esther_o", firstName: "Esther", lastName: "Okonkwo", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Jan 2025", challengesCompleted: 15, isGroupMember: true },
  { username: "ryan_c", firstName: "Ryan", lastName: "Carter", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Feb 2025", challengesCompleted: 3, isGroupMember: false },
  { username: "hannah_l", firstName: "Hannah", lastName: "Lopez", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 11, isGroupMember: true },
  { username: "chris_t", firstName: "Christopher", lastName: "Taylor", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Oct 2024", challengesCompleted: 8, isGroupMember: false },
  { username: "ruth_p", firstName: "Ruth", lastName: "Phillips", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Sep 2024", challengesCompleted: 23, isGroupMember: true, hasInvited: true },
  { username: "samuel_n", firstName: "Samuel", lastName: "Nguyen", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Dec 2024", challengesCompleted: 9, isGroupMember: false },
  { username: "miriam_d", firstName: "Miriam", lastName: "Davis", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Jan 2025", challengesCompleted: 12, isGroupMember: true },
  { username: "aaron_r", firstName: "Aaron", lastName: "Robinson", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Feb 2025", challengesCompleted: 4, isGroupMember: false },
  { username: "leah_s", firstName: "Leah", lastName: "Scott", churchName: "Cornerstone Community Church", churchCode: "cornerstone", memberSince: "Nov 2024", challengesCompleted: 16, isGroupMember: true },
  // --- Other church members (for cross-church search) ---
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

// --- Invite system (localStorage-backed) ---

const INVITED_KEY = "fbs_has_invited";

export function markInviteSent() {
  localStorage.setItem(INVITED_KEY, "true");
}

export function hasInvited(): boolean {
  return localStorage.getItem(INVITED_KEY) === "true";
}
