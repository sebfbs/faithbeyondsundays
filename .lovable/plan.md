

## Fix Content Background to Fill Full Width

### Problem
When the sidebar is collapsed, the main content area's background doesn't stretch to both edges of the screen. There's a visible gap/cutoff on the right side because the content is constrained by `tablet-content-inner` with `max-width: 640px` and `margin: 0 auto`.

### Fix

**File: `src/pages/Index.tsx`**
- Move the background styling from the inner content wrapper to the `<main>` element so the background fills the full width behind the sidebar margin
- Ensure the `<main>` tag stretches to the right edge of the viewport

**File: `src/index.css`**
- On the `tablet-content` class (the `<main>` element), add `width: 100%` or ensure it naturally fills remaining space
- Keep `tablet-content-inner` with its max-width for readable content width, but the background behind it should go edge-to-edge

The key insight: the content cards can stay centered at 640px max-width, but the page background (gradient) needs to fill the entire area from the sidebar edge to the right side of the screen.

