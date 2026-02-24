

# Expanded Community Pulse: Show Everyone's Activity

## The Idea

Right now the backend returns just 1 reflector, 1 milestone, and 1 newest member. For a busy community where 30 people reflected today, 29 of them never get seen. We fix this by having the backend return **arrays** of recent activity, so the rotation can cycle through all of them -- giving every active member their moment in the spotlight.

## How It Feels

A quiet community (1-2 stories) stays static and dignified. A busy community with 15+ stories becomes a lively ticker that makes you think "wow, everyone is on here" -- exactly the psychological nudge we want. Every person who does something gets their chance to appear.

## Strategy

- Backend returns up to **10 recent reflectors**, **5 recent milestones**, and **3 newest members** from the past 24-48 hours
- Frontend builds a combined stories array from all of them
- Threshold rules still apply: 0 = hide, 1-2 = static, 3+ = rotate
- A busy community could have 10+ rotating stories -- that looks phenomenal
- Locked/demo cards stay hardcoded with 3 stories (always rotating)

## Technical Details

### 1. New Database Function: `get_community_pulse_v2`

Create a new RPC that returns arrays instead of single objects:

```sql
-- Returns:
-- recent_reflectors: up to 10 people who reflected in the last 48 hours
-- recent_milestones: up to 5 badge milestones earned in the last 7 days
-- recent_members: up to 3 people who joined in the last 7 days
-- active_avatars: up to 5 distinct active user avatars (unchanged)
```

Key differences from current RPC:
- `recent_reflectors` is an **array** (up to 10) instead of a single `latest_reflector`
- `recent_milestones` is an **array** (up to 5) instead of a single `milestone`
- `recent_members` is an **array** (up to 3) instead of a single `newest_member`
- Each array is filtered to recent activity only (48h for reflections, 7 days for milestones/members) so stale events don't appear
- Still excludes the current user from all results

### 2. Update `src/components/fbs/CommunityPulse.tsx`

**New PulseData interface:**
- Change from single objects to arrays: `recent_reflectors[]`, `recent_milestones[]`, `recent_members[]`

**Build stories array:**
- Loop through all milestones and create a story for each
- Loop through all reflectors and create a story for each
- Loop through all new members and create a story for each
- Each story has: `icon`, `message` string

**Threshold + rotation logic:**
- `stories.length === 0`: hide card
- `stories.length <= 2`: show first story statically
- `stories.length >= 3`: rotate every 5 seconds with fade animation (300ms fade-out, swap, 300ms fade-in)
- Pause rotation when browser tab is hidden

**Locked state (`LOCKED_PULSE`):**
- Update to use the new array format with 3 hardcoded stories (Sarah milestone, Marcus reflection, Emily joined)
- Always rotates since it has 3 stories

**Demo state (`DEMO_COMMUNITY_PULSE`):**
- Update to use the new array format with multiple stories

### 3. Update `src/components/fbs/demoData.ts`

- Update `DEMO_COMMUNITY_PULSE` to use the new array-based format with several stories so the demo mode also shows an active-looking rotation

### Files Modified

| File | Change |
|---|---|
| Database migration | New `get_community_pulse_v2` RPC returning arrays of recent activity |
| `src/components/fbs/CommunityPulse.tsx` | New data interface, stories builder, threshold logic, rotation with fade animation, updated locked data |
| `src/components/fbs/demoData.ts` | Update `DEMO_COMMUNITY_PULSE` to array-based format |

