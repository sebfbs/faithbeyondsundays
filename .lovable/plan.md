

## Fix: Church Data Compartmentalization on Community Page

### Problem
The Community page currently shows members, roles, and groups from ALL churches instead of only the logged-in user's church. This is a data isolation bug -- church data must stay within each church.

### What Changes

**1. Pass `userChurchId` (UUID) from Index.tsx to CommunityScreen**

The parent component already has the user's profile with `church_id`. We'll thread it through as a new prop so the Community page can filter queries properly.

**2. Filter profiles query by `church_id`**

Currently fetches all profiles. Will add `.eq("church_id", userChurchId)` so only same-church members appear in the Church Members list.

**3. Filter user_roles query by `church_id`**

Currently fetches all roles across all churches. Will add `.eq("church_id", userChurchId)` so role badges (Pastor, Staff, etc.) only reflect the user's church.

**4. Add explicit `church_id` filter to community_groups query**

RLS already handles this, but adding `.eq("church_id", userChurchId)` as defense-in-depth.

**5. Clean up `churchMembers` memo**

The memo currently only filters by `churchCode` in demo mode and passes everything through in real mode. Once the query is properly filtered, this becomes simpler.

### Result
- Cornerstone members only see Cornerstone members, groups, and roles
- Pennhurst members only see Pennhurst members, groups, and roles
- Cross-church profile discovery remains available ONLY in the search/follow bar (intentional)

### Files Changed

| File | Change |
|------|--------|
| `src/components/fbs/CommunityScreen.tsx` | Add `userChurchId` prop; add `.eq("church_id", ...)` to profiles, user_roles, and community_groups queries |
| `src/pages/Index.tsx` | Pass `userChurchId` from the user's profile to CommunityScreen |

### No Database Changes Needed
The RLS policies are correct as-is. This is purely an application-level query filtering fix.

