

## Add Tiny Twinkling Stars to the Evening Sky

Small decorative star dots will appear at the top of the homepage only during the evening gradient (after 5pm), reinforcing the nighttime sky feel.

### What You'll See

Around 15-20 tiny white dots (2-3px) scattered across the top portion of the page. A few will have a gentle twinkle animation. They only render in the evening -- morning and afternoon skies stay clean.

### Technical Details

- In `HomeTab.tsx`, add a small `Stars` component that renders ~18 absolutely-positioned tiny white circles near the top of the page.
- Each star gets a random-looking but fixed position (using hardcoded percentages), varying size (1-3px), and varying opacity (0.3-0.9) for depth.
- A few stars get a subtle CSS twinkle animation (a slow opacity pulse defined via a Tailwind keyframe or inline style).
- The stars container uses `pointer-events-none` so it never blocks taps.
- Wrap the stars render in a time check: only show them when `new Date().getHours() >= 17` (same evening threshold as the greeting and gradient).
- Add a `twinkle` keyframe animation to `index.css` for the pulsing effect.

