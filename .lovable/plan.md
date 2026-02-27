

## Scroll-Aware Top Bar -- Apple-Style Fade-In

### What Changes
The frosted-glass status bar overlay at the top of the home screen will start fully transparent when the page loads (scrolled to top), then smoothly fade in as the user scrolls down -- just like Apple's native iOS apps.

### Behavior
- **At scroll position 0**: Top bar is invisible (fully transparent, no blur). The home screen content extends cleanly to the top edge.
- **Scrolling down (0-60px)**: The bar progressively fades in -- opacity and blur increase proportionally.
- **Past 60px**: Bar is fully opaque with the current frosted-glass appearance (blur + card background).
- **Scrolling back to top**: Bar fades out again smoothly.

### Technical Details

**File: `src/pages/Index.tsx`**

1. Add a `scrollY` state variable (or ref) that tracks the main content area's scroll position via an `onScroll` listener on the `<main>` element (which already has `ref={mainRef}`).

2. Compute an opacity value: `Math.min(scrollY / 60, 1)` to get a 0-to-1 ratio over 60px of scroll.

3. Apply that ratio to the existing top bar's `background` opacity and `backdropFilter` blur amount:
   - Background: `hsl(var(--card) / ${0.95 * ratio})`
   - Blur: `blur(${12 * ratio}px)`
   - When ratio is 0, the bar is completely invisible.

4. This only applies to the mobile view (the bar is already gated behind `isMobile`).

**No other files need to change.**

