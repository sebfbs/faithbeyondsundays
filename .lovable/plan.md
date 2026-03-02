

## Full-Screen Daily Spark Overlay

### Overview
On first app open each day, a full-screen overlay displays the Daily Spark message with a typewriter animation over the home screen's sky gradient background. Tap to dismiss; won't appear again until the next day.

### New File: `src/components/fbs/DailySparkOverlay.tsx`
- Fixed full-screen overlay at `z-50` (covers everything including bottom nav)
- Background uses `getSkyGradient()` from HomeTab -- same time-of-day sky the user sees on home
- Evening (after 5pm): render the `Stars` component (extracted/duplicated from HomeTab)
- "Today's Spark" label with Sparkles icon, centered upper area
- Large white text for the spark message, centered vertically
- **Typewriter effect**: characters revealed one at a time (~35ms interval) via `useState`/`useEffect` with a blinking cursor
- After typing completes, "Tap to continue" hint fades in at the bottom
- Tap anywhere to dismiss with a fade-out transition (300ms opacity)
- **Once-per-day logic**: on dismiss, writes today's date (`YYYY-MM-DD`) to `localStorage` key `fbs_spark_seen_date`; on mount, skips rendering if stored date matches today

### Modified: `src/pages/Index.tsx`
- Import and render `DailySparkOverlay` near the top of the component tree
- Pass the spark message:
  - Church users: `sermon?.spark` (already available at this level)
  - Churchless users: lift the `generate-daily-content` query from HomeTab to Index so the overlay can access `spark_message` before HomeTab mounts
- Pass the fetched `dailyContent` down to HomeTab as a prop to avoid duplicate requests
- Only render the overlay when spark content is available (not during loading)

### Modified: `src/components/fbs/HomeTab.tsx`
- Accept an optional `dailyContent` prop
- If provided, skip the internal `useQuery` for `generate-daily-content` and use the prop instead
- No other changes needed

### Design Details
- Background: full `getSkyGradient()` covering the viewport
- Stars rendered in evening only (no sun rays)
- Text: white, large (~1.25rem-1.5rem), with comfortable padding
- Sparkles icon + "Today's Spark" label in small caps above the message
- Blinking cursor: thin white bar with CSS `animate-pulse`
- "Tap to continue" uses subtle white/70% opacity text

### No database changes needed
Uses localStorage for persistence and existing data sources for content.

