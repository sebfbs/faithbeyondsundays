

## Sync Group Membership Between Sheet and Community Screen

### Problem
When you leave (or join) a group inside the GroupDetailSheet, the membership state only updates inside the sheet. When you close and go back to the community page:
- The group card still shows "Joined" pill (demo mode)
- Re-opening the group shows the old membership state (demo mode)
- For real accounts, the query invalidation refreshes the groups list, but `selectedGroup` is a stale snapshot

### Solution
Add an `onMembershipChange` callback from GroupDetailSheet back to CommunityScreen so the parent updates its state when membership changes.

### Changes

**1. `GroupDetailSheet.tsx`**
- Add `onMembershipChange?: (isMember: boolean) => void` to props
- Call it when demo membership toggles (`setDemoMember`)
- Call it in `onSuccess` of join/leave mutations for real groups

**2. `CommunityScreen.tsx`**
- For demo mode: track demo group membership in local state (e.g., `demoMemberships` map), initialize from `DEMO_GROUPS`, and update when the callback fires. The group cards derive `isMember` from this state.
- For real mode: when `onMembershipChange` fires, update `selectedGroup` so the sheet reflects the new state if re-opened before the query refetches.
- Pass the callback to `GroupDetailSheet`

### Result
- Leave group in sheet -> close sheet -> card shows "Join" instead of "Joined"
- Re-open group -> sheet correctly shows "Join" button
- Join group in sheet -> close -> card shows "Joined"
- Works in both demo and real mode
