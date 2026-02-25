

## Rewrite AnimatedLogo: One Continuous Stroke, No Fill, Matches Reference Image

### What the logo should look like
Looking at your uploaded reference image, the final result should be four thick, hollow teardrop loops (top, right, bottom, left) with white/transparent holes in the middle of each loop. The loops cross at the center forming an X pattern. A vertical gradient flows from cornflower blue at the top through warm neutral to amber/gold at the bottom. **No solid fill inside the loops** -- just thick stroked outlines with empty interiors.

### Two problems to fix

1. **No fill inside the holes**: The current code already uses `fill="none"` and thick strokes, which is correct. But the previous plan mentioned adding fill layers -- that is NOT wanted. The logo should remain stroke-only (`fill="none"`), creating hollow loops where you can see through to the background.

2. **One continuous drawing motion**: Instead of animating four separate paths one at a time, combine all four loops into a **single SVG path** that traces continuously from center -> top loop -> center -> right loop -> center -> bottom loop -> center -> left loop -> center. Then animate this single path with one `stroke-dashoffset` animation, creating the effect of a pen drawing it all in one go without lifting.

### Changes

**File: `src/components/fbs/AnimatedLogo.tsx`** -- rewrite

- **Single continuous path**: Concatenate all four teardrop bezier loops into one path string. Each loop starts at center (50,50), curves out to a teardrop tip, and returns to center, then continues to the next loop. No `M` (moveTo) commands between loops -- just smooth continuation back through center.
  ```
  M 50,50 C ... [top loop] ... 50,50 C ... [right loop] ... 50,50 C ... [bottom loop] ... 50,50 C ... [left loop] ... 50,50
  ```

- **Stroke-only rendering**: `fill="none"`, `stroke-width="10"`, `stroke-linecap="round"`, `stroke="url(#gradient)"`. No fill layers at all -- the insides of each loop stay transparent/empty.

- **Single animation**: One `stroke-dasharray` / `stroke-dashoffset` animation over ~2 seconds with `ease-in-out` timing. The pen traces the entire logo in one continuous motion.

- **Gradient**: Keep the same vertical gradient: `#89B4D8` (top) -> `#D4B896` (mid) -> `#F0A500` (bottom).

- **Unique gradient ID**: Use a React `useId()` hook to generate a unique gradient ID so multiple instances don't conflict.

No other files change.

