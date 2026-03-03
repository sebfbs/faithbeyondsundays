

## Three Fixes

### 1. Report/Block Sheet Cut Off
The sheet is being covered by the bottom nav (z-50) because it sits behind it. The sheet has `z-50` but the bottom nav also has `z-50`. Additionally, `pb-8` plus safe area isn't enough — the bottom nav (49px + safe area) overlaps the bottom of the sheet.

**Fix in `ReportBlockSheet.tsx`:**
- Increase z-index to `z-[60]` so it layers above the bottom nav
- Increase bottom padding to account for the bottom nav height (~49px + safe area)
- Change `paddingBottom` to `calc(env(safe-area-inset-bottom, 0px) + 5rem)` to clear the tab bar

### 2. Report vs Block — Do You Need Report?
**Yes, you need Report for the Apple App Store.** Apple's Guideline 1.2 (User Generated Content) requires that apps with UGC provide a mechanism to **report** objectionable content, not just block users. Block only hides content for the blocker — Report lets church admins review and take action on harmful content. Removing Report would risk App Store rejection.

That said, the label "Flag this content for review" can be made clearer. I'll update the description to say "Report to church leadership" so users understand what it does.

### 3. Bottom Nav Filled Icons Look Weird
The filled icons (especially BookOpen and BookMarked) look chunky/blobby when filled. Instead of using `fill`, I'll switch to just using a heavier stroke weight and the accent color for active state — no fill. This matches how many iOS apps handle outline-style icons (e.g., Apple Music, Podcasts).

**Fix in `BottomNav.tsx`:**
- Remove `fill={isActive ? colors.accent : "none"}`
- Active state: accent color + `strokeWidth: 2` (slightly bolder)
- Inactive state: muted color + `strokeWidth: 1.5`

### Files to change
| File | Change |
|------|--------|
| `src/components/fbs/ReportBlockSheet.tsx` | z-index to 60, increase bottom padding, clarify Report description |
| `src/components/fbs/BottomNav.tsx` | Remove fill on active icons, use stroke weight + color only |

