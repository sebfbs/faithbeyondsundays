

## Cleaning Up the More Sheet

Two issues to address:

### 1. Highlight the "More" icon when the sheet is open
Currently `activeTab` only becomes `"more"` when navigating to overlay screens (community, bible, etc.). When the More sheet pops up over Journal or Home, the icon stays unhighlighted. 

**Fix:** Pass `moreOpen` to `BottomNav` and use it to force the More icon to show as active.

**BottomNav changes:**
- Add `moreOpen?: boolean` prop
- Override active state: if `moreOpen` is true, highlight "more" and dim all other tabs

### 2. Cleaner More sheet design
The current sheet has a nested bordered card inside a card, creating a double-layer effect that looks cluttered. A cleaner iOS-native approach:

- Remove the inner bordered container — just render the rows directly on the sheet background
- Use subtle `ml-[calc(18px+12px)]` left-aligned hairline dividers (inset from icon, like iOS Settings)
- Slightly larger row height (`py-3.5`) for better touch targets
- Remove the "More" title header and X button — instead, tapping the backdrop or swiping dismisses (this matches iOS action sheets). Or keep a small drag handle pill at top.
- Increase z-index to `z-[55]` so it layers above the bottom nav

**Alternatively**, keep it mostly as-is but just:
- Remove the inner border wrapper (the double-card look)
- Add a small drag-handle pill instead of the X button header
- Ensure z-index is above the nav bar

I'd recommend the simpler cleanup approach — remove the inner border, add a drag handle, bump z-index. This keeps it recognizable while making it feel cleaner and more native.

### Files to change
| File | Change |
|------|--------|
| `src/components/fbs/BottomNav.tsx` | Add `moreOpen` prop, highlight More icon when sheet is open |
| `src/components/fbs/MoreSheet.tsx` | Remove inner bordered card, add drag handle pill, bump z-index to 55 |
| `src/pages/Index.tsx` | Pass `moreOpen` to BottomNav |

