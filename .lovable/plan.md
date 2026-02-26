

## Fix Group Detail Sheet Desktop Width + Add Demo Group

### Problem
1. The group detail drawer stretches to full screen width on desktop/tablet, looking awkward (as shown in your screenshot)
2. Demo mode has no groups visible because the groups section is conditionally hidden with `!isDemo`

### Changes

**1. Constrain the drawer width on desktop**

File: `src/components/fbs/GroupDetailSheet.tsx`
- Add `max-w-lg mx-auto` to the `DrawerContent` so it stays centered and capped at ~512px wide, matching the mobile-first design on larger screens

**2. Add a "Women's Group" to demo data**

File: `src/components/fbs/demoData.ts`
- Add a `DEMO_GROUPS` export with one group: "Women's Group" (id, name, description, memberCount, isMember: true)

**3. Show groups in demo mode**

File: `src/components/fbs/CommunityScreen.tsx`
- Import `DEMO_GROUPS` from demoData
- Change the groups section condition from `!isSearching && !isDemo && groups.length > 0` to `!isSearching && displayGroups.length > 0` where `displayGroups` is `isDemo ? DEMO_GROUPS : groups`
- When a demo group is selected, open the GroupDetailSheet with mock data (chat/members will show empty states since there's no real data, which is fine for preview)

### Technical details

| File | What changes |
|------|-------------|
| `src/components/fbs/GroupDetailSheet.tsx` | Add `max-w-lg mx-auto` to `DrawerContent` className |
| `src/components/fbs/demoData.ts` | Add `DEMO_GROUPS` array with one "Women's Group" entry |
| `src/components/fbs/CommunityScreen.tsx` | Import demo groups, merge into display logic so groups show in demo mode |

The drawer width fix is the main visual improvement -- it will look properly contained on desktop/tablet instead of stretching edge-to-edge.
