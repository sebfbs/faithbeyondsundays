

## Three Time-of-Day Sky Themes

### Concept

Each time period gets its own subtle ambient element in the sky, similar to how the evening has twinkling stars:

- **Morning (before 12pm)**: Soft, warm sun rays radiating from the upper-right corner. A gentle golden glow with subtle animated light beams that slowly pulse, giving a peaceful sunrise/early-day feel.
- **Afternoon (12pm-5pm)**: Small, wispy white clouds that slowly drift across the top of the screen. Two or three soft cloud shapes with a gentle horizontal float animation, evoking a calm midday sky.
- **Evening (after 5pm)**: Twinkling stars (already implemented, no changes needed).

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**
- Add a `SunRays` component: renders 3-4 semi-transparent white/golden gradient beams positioned in the upper-right area, with a slow pulsing opacity animation. Uses absolute positioning similar to the `Stars` component.
- Add a `Clouds` component: renders 2-3 cloud shapes using layered `div` elements with rounded corners and white/semi-transparent backgrounds. Each cloud gets a slow horizontal CSS animation (drifting left to right, staggered).
- Update the conditional rendering:
  - `hour < 12` renders `<SunRays />`
  - `hour >= 12 && hour < 17` renders `<Clouds />`
  - `hour >= 17` renders `<Stars />` (unchanged)

**File: `src/index.css`**
- Add `@keyframes sun-pulse` for a gentle opacity pulse (0.4 to 0.7 over ~4 seconds)
- Add `@keyframes cloud-drift` for horizontal movement (translate from -20% to 120% over ~40-60 seconds, staggered per cloud)
- Add corresponding utility classes `.animate-sun-pulse` and `.animate-cloud-drift`

No changes to gradients, colors, or other files needed. The sky gradients already shift per time of day -- this just adds the ambient overlay elements to complete the feel.
