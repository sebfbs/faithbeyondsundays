

# Follower & Following Counts on All Profiles

## What Changes

Add visible **follower count** and **following count** to every profile (your own profile, public profiles, community member cards). Tapping on either count opens a list of those users, where you can tap into their profile or follow/unfollow them directly -- enabling organic discovery through other people's networks.

## How It Works

- Your own profile shows "12 Followers | 8 Following" below your name
- Other people's public profiles show the same counts
- Tapping "Followers" or "Following" opens a scrollable list of users
- Each user in that list has a Follow/Following button and is tappable to view their profile
- This creates a discovery loop: see someone interesting on a profile, follow them, their followers discover you

## Visual Layout

```text
Own Profile:
  [Avatar]
  Sarah Mitchell
  @sarah_m
  Cornerstone Community Church
  [12 Followers]  [8 Following]    <-- tappable

Public Profile:
  [Avatar]
  Marcus Johnson
  @marcus_j
  [24 Followers]  [15 Following]   <-- tappable
  [Follow] button
```

Followers/Following List (opens as overlay):
```text
  [Back]  Followers (12)
  ┌─────────────────────────────┐
  │ [avatar] Sarah M.  [Following] │
  │ [avatar] David C.  [Follow]    │
  │ [avatar] Grace O.  [Following] │
  └─────────────────────────────┘
```

## Technical Details

### 1. Migrate follows from localStorage to the database

The `follows` table already exists in the database with `follower_id` and `following_id` columns and proper RLS. Currently the frontend uses localStorage via `communityData.ts`. We need to switch all follow actions to use the real DB table.

### 2. New component: `src/components/fbs/FollowListSheet.tsx`

A bottom sheet or full-screen overlay that shows a list of followers or following for a given user. Props:
- `userId`: whose list to show
- `mode`: "followers" | "following"
- `onClose`: close handler
- `onViewProfile`: navigate to a user's profile

Fetches from the `follows` table joined with `profiles` to get names, avatars, and usernames. Each row shows avatar, name, username, and a Follow/Unfollow button.

### 3. Update `src/components/fbs/PublicProfileScreen.tsx`

- Accept a `userId` prop (the profile owner's user_id) so we can query follows
- Fetch follower count and following count from the `follows` table using two count queries
- Display "X Followers | Y Following" as tappable text below the username
- Tapping either opens `FollowListSheet` with the appropriate mode
- Replace localStorage-based follow/unfollow with real DB inserts/deletes on the `follows` table

### 4. Update `src/components/fbs/ProfileScreen.tsx` (own profile)

- Fetch follower count and following count for the current auth user
- Display "X Followers | Y Following" below the username/church name
- Tapping either opens `FollowListSheet`

### 5. Update `src/components/fbs/communityData.ts`

- Keep the localStorage helpers as fallback for demo mode only
- Add new async functions that use the real `follows` table:
  - `followUser(followingId)`: insert into follows table
  - `unfollowUser(followingId)`: delete from follows table
  - `getFollowerCount(userId)`: count query
  - `getFollowingCount(userId)`: count query
  - `isFollowingUser(followingId)`: check if current user follows them

### 6. Update `src/components/fbs/CommunityScreen.tsx` and `ChurchlessCommunity.tsx`

- Pass the `user_id` through to `onViewProfile` so `PublicProfileScreen` can query follows (the `CommunityMember` type needs a `userId` field added)

### 7. Demo mode handling

- In demo mode, follower/following counts use hardcoded numbers from `DEMO_MEMBERS`
- The follow list in demo mode shows other demo members
- Real mode uses the database

### Files Modified

| File | Change |
|---|---|
| `src/components/fbs/FollowListSheet.tsx` | New component -- scrollable list of followers/following with follow buttons |
| `src/components/fbs/PublicProfileScreen.tsx` | Add follower/following counts, tappable to open list, DB-backed follow/unfollow |
| `src/components/fbs/ProfileScreen.tsx` | Add follower/following counts below name, tappable to open list |
| `src/components/fbs/communityData.ts` | Add DB-backed follow/unfollow functions, add userId to CommunityMember type |
| `src/components/fbs/CommunityScreen.tsx` | Pass user_id through member objects to profile views |
| `src/components/fbs/ChurchlessCommunity.tsx` | Pass user_id through member objects to profile views |
| `src/components/fbs/demoData.ts` | Add demo follower/following counts |

No database migration needed -- the `follows` table and RLS policies already exist.

