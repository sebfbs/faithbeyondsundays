

## Fix: App-Wide Input Focus on iOS PWA + No Zoom

### What's Happening
Every text input and textarea across the app (auth, reflection, journal, prayer, profile) fails to receive focus when tapped in iOS PWA (home screen) mode. The keyboard simply doesn't appear. Additionally, inputs must not trigger iOS auto-zoom.

### Why It's Happening
Three CSS properties are combining to trigger a known iOS WebKit standalone-mode bug:

1. **`#root` uses `display: flex` + `min-height: 100dvh`** -- iOS WebKit in standalone mode has trouble delivering focus events to inputs nested inside flex containers with viewport-height constraints
2. **`.app-container` uses `overflow-x: clip`** -- on older iOS versions, `clip` behaves like `hidden` and creates the same focus-blocking behavior
3. **`animate-fade-in` on many screen containers** -- CSS animations on parent elements prevent iOS from recognizing inputs as focusable during/after animation

### The Fix (3 changes, 2 files)

**File: `src/index.css`**

1. Add a `@media (display-mode: standalone)` block that overrides `#root` to use `display: block` instead of `flex`, and sets `min-height: 100%` instead of `100dvh`. This eliminates the flex + viewport-height combo that blocks focus in PWA mode. The normal browser experience stays unchanged.

2. Remove `overflow-x: clip` from `.app-container` entirely. The `max-width: 430px` constraint already prevents horizontal overflow, so this property was just a safety net that's now causing harm.

3. Add a global rule ensuring all inputs and textareas have `font-size: 16px` in standalone mode. iOS auto-zooms on focus when font-size is below 16px -- this prevents that zoom without needing inline styles on every input. The viewport meta tag already has `maximum-scale=1.0, user-scalable=no` which helps, but the 16px rule is the definitive fix.

**File: `src/components/fbs/AuthScreen.tsx`**

4. Remove the inline `style={{ fontSize: '16px', touchAction: 'manipulation' }}` from the email and password inputs since the global CSS rule will handle this. Keeps the code clean.

### What This Does NOT Change
- No layout changes to the visible UI
- No changes to animations on screens without inputs (welcome screen keeps its animation)
- Normal Safari browser experience is untouched (fixes only apply inside `display-mode: standalone`)
- No new dependencies

### Technical Summary
- `src/index.css`: Add standalone media query for `#root`, remove `overflow-x: clip`, add global input font-size rule
- `src/components/fbs/AuthScreen.tsx`: Clean up inline font-size styles (now handled globally)

