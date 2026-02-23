

## Fix: Churchless Users Seeing Church Data and Fake Badges

### Bug 1 -- Community showing Cornerstone members for churchless users

In `src/pages/Index.tsx` line 239, the CommunityScreen receives:
```
userChurchCode={userData.churchCode || "cornerstone"}
```

This fallback means churchless users (empty `churchCode`) always get `"cornerstone"`, causing demo members from Cornerstone Community Church to appear. The fix is to remove the fallback and pass the empty string:
```
userChurchCode={userData.churchCode}
```

The CommunityScreen already handles the empty `userChurchCode` case -- it shows a "Find Your Community" banner (lines 69-86 of CommunityScreen.tsx).

### Bug 2 -- Hardcoded badges on Profile

In `src/components/fbs/ProfileScreen.tsx` lines 22-26, every user gets four badges unconditionally: "Member Since", "Founding Member", "First Reflection", and "Group Member". These are all hardcoded and don't reflect actual user activity.

Per the memory note on community features, challenge-related badges have been removed from the app. The badges should be dynamic based on real data:

- **Member Since** -- only show if user has a church (use actual `profile.created_at` or `memberSince` data)
- **Founding Member** -- only show if user signed up before a certain date or meets a criteria
- **First Reflection** -- only show if user has at least one journal entry
- **Group Member** -- only show if user is actually in a community group

For now, the simplest correct fix: remove "Group Member" badge for churchless users, and make badges conditional on real state.

### Technical Changes

**File: `src/pages/Index.tsx`**
- Line 239: Change `userData.churchCode || "cornerstone"` to `userData.churchCode`

**File: `src/components/fbs/ProfileScreen.tsx`**
- Lines 21-35: Make the `getProfileBadges` function conditional:
  - Always show "Member Since" (it's a universal badge)
  - Only show "Founding Member" if the user has a church connection
  - Only show "First Reflection" if the user has journal entries (for now keep it, since we don't have that data in scope -- but remove for churchless)
  - Only show "Group Member" if the user has a church
  - Keep the "Community Builder" (invite) badge as-is since it's already conditional
