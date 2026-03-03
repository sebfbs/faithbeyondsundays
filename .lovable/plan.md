

## Status Bar Fix

**What you want:**
- **Home (sky background):** Top bar fully transparent at scroll 0 (sky visible edge-to-edge). Fades to solid by ~60px scroll.
- **All other pages:** Top bar always solid `hsl(var(--background))` — no fade, no transparency.

**Current issue:** Both home and non-home pages use `topBarRatio` (scroll-based), so non-home pages start transparent too.

**Change — single edit in `src/pages/Index.tsx` (lines 386–394):**

For non-home pages, set opacity to a constant `0.95` and blur to `12px` regardless of scroll. For home, keep the current scroll-fade logic unchanged.

```tsx
const isHome = overlay === null && activeTab === "home";

style={{
  height: "env(safe-area-inset-top, 0px)",
  backdropFilter: `blur(${isHome ? 12 * topBarRatio : 12}px)`,
  WebkitBackdropFilter: `blur(${isHome ? 12 * topBarRatio : 12}px)`,
  background: isHome
    ? getSkyGradientTopColor().replace(')', ` / ${0.95 * topBarRatio})`)
    : `hsl(var(--background) / 0.95)`,
  transition: "background 0.1s, backdrop-filter 0.1s, -webkit-backdrop-filter 0.1s",
}}
```

One file, ~4 lines changed. No other files affected.

