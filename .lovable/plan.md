

## Time-Adaptive Accent Colors on the Home Tab

Right now every icon bubble, pill badge, and button uses the same golden amber accent regardless of the time of day. That works beautifully against the warm morning and bright afternoon skies, but clashes with the cool evening palette. We'll make the accent colors shift along with the background.

### Color Palettes

| Time of Day | Accent Color | Icon Background | Streak Banner |
|---|---|---|---|
| **Morning** (before 12pm) | Golden amber (current) | Warm amber tint | Current warm gradient |
| **Afternoon** (12pm-5pm) | Golden amber (current) | Warm amber tint | Current warm gradient |
| **Evening** (after 5pm) | Soft sky blue / lavender | Cool blue-indigo tint | Cool blue-toned gradient |

The evening accent will be a soft, luminous blue (around hsl 215-220, lightness ~65%) that complements the deep navy-to-amber sky gradient -- still visible and pretty on the white cards, but no longer fighting the cool tones.

### What Changes

Inside `HomeTab.tsx`, we'll create a helper (similar to `getSkyGradient()`) that returns a set of accent colors based on the hour. The component will use these colors via inline styles instead of the hardcoded Tailwind `text-amber` / `bg-amber` classes. This keeps the change scoped to the Home tab only -- no global CSS variables need to change.

**Elements that will adapt:**
- Icon circle backgrounds (the small round containers behind Sparkles, Target, BookText, Flame icons)
- Icon colors themselves
- Pill badges ("Today's Spark", "Weekly Challenge")
- "Accept Challenge" button
- "Challenge Accepted" and "Challenge Completed" status badges
- Streak banner background, border, and icon square
- Guided Reflection icon

### Technical Details

- Add a `getAccentColors()` function that returns an object with keys like `accent`, `accentBg`, `accentBorder`, `pillBg`, `pillText`, etc. Morning/afternoon return the current amber values; evening returns cool blue/lavender equivalents.
- Replace Tailwind amber utility classes (`text-amber`, `bg-amber`, `bg-amber-bg`, `amber-pill`, `shadow-amber`) with inline `style` attributes that reference the accent object.
- The streak banner's gradient background and border will also pull from the accent object.
- No new files, dependencies, or CSS changes needed -- everything is scoped to `HomeTab.tsx`.

