

# Locked Community Pulse Card for Churchless Users

## What Changes

Update `CommunityPulse.tsx` to accept a `locked` prop. When `locked` is true, the card renders with hardcoded "Sarah earned their 10 Reflections badge!" content (matching the demo), but visually grayed out and non-interactive -- creating FOMO that incentivizes joining a church.

Update `HomeTab.tsx` to show the Community Pulse card for churchless users too, but in locked mode.

## Visual Treatment

- Card content is identical to the demo milestone message
- Entire card has reduced opacity (~50%) and a subtle grayscale filter
- `pointer-events: none` so tapping does nothing
- A small overlay label at the bottom: "Join a church to see your community" in muted text

## Technical Details

### `src/components/fbs/CommunityPulse.tsx`
- Add `locked?: boolean` to props
- When `locked` is true:
  - Skip the RPC query entirely
  - Use hardcoded pulse data showing a milestone event ("Sarah earned their 10 Reflections badge!") with placeholder avatars
  - Apply `opacity-50 grayscale pointer-events-none` to the outer button
  - Append a small text line: "Join a church to see your community"

### `src/components/fbs/HomeTab.tsx`
- Change the Community Pulse section from `{hasChurch && ...}` to always render
- When `!hasChurch`, pass `locked={true}` (and no `churchId`/`userId`)

### Files Modified

| File | Change |
|------|--------|
| `src/components/fbs/CommunityPulse.tsx` | Add `locked` prop, hardcoded locked state, grayed-out styling |
| `src/components/fbs/HomeTab.tsx` | Show CommunityPulse for all users, pass `locked` when churchless |

