

## Fix Clouds Positioning and Clipping

### Problems
1. Clouds overlap the greeting text in the upper-left, making it hard to read
2. When the sidebar is collapsed, clouds appear to spawn/cut off at a visible edge because the cloud container uses `left-0` relative to the inner content area, not the full viewport

### Changes

**File: `src/components/fbs/HomeTab.tsx` -- Clouds component**
- Move clouds to the **right side** of the screen so they don't overlap the greeting text (shift from upper-left to upper-right area)
- Increase the cloud container height slightly and push clouds further right with higher `top` values so they sit above the cards but below/beside the greeting
- Make clouds more subtle (reduce opacity slightly) so even if they drift near text they don't obscure it
- Change the drift animation direction to drift **right-to-left** so clouds originate off-screen right and exit off-screen left -- this avoids any visible "spawn line" at the container edge

**File: `src/index.css` -- cloud-drift keyframes**
- Update `cloud-drift` keyframes to go from `translateX(110%)` to `translateX(-30%)` (right-to-left) so clouds always enter smoothly from the right edge and never show a hard cutoff line on the left where the sidebar meets the content
