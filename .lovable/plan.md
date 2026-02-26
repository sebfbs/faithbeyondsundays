

## Show Church Association on Profiles

### Problem
When viewing someone's public profile (e.g., Benjamin Kim), the church they belong to ("Faith Chapel") is visible in search results but disappears once you tap into their full profile. The church name should be displayed on both the public profile and the user's own profile.

### Changes

**1. PublicProfileScreen -- Add church name below the user's name** (`src/components/fbs/PublicProfileScreen.tsx`)

Below the name heading (line 161-163), add a line showing the member's church name when available. This mirrors how the search result card already displays it.

```
{member.firstName} {member.lastName}
Faith Chapel    <-- new line, styled as muted text with a small church icon
```

The `member.churchName` field is already populated from the `CommunityMember` type, so no data fetching changes are needed.

**2. ProfileScreen -- Confirm own profile already shows church** (`src/components/fbs/ProfileScreen.tsx`)

The user's own profile already displays `user.churchName` (line 288-289). No changes needed here -- just confirming it's already working.

### Files Changed

| File | Change |
|------|--------|
| `src/components/fbs/PublicProfileScreen.tsx` | Add church name display below the user's full name, using the existing `member.churchName` data |

### No Backend Changes
The `churchName` field is already part of the `CommunityMember` interface and is populated when navigating to a profile. This is purely a UI addition.
