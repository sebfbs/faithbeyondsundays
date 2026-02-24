

## Fix: Journal Plus Button Overlap and iOS Keyboard Gap

### Bug 1: Plus button tucked under the nav bar

The floating "+" button uses `bottom-24` (96px fixed). The bottom nav is 68px tall plus the iOS safe area inset (typically 34px on newer iPhones), totaling around 102px. So the button sits behind the nav bar.

**Fix in `src/components/fbs/JournalTab.tsx` (line 581)**:
- Change the button's bottom positioning from a fixed Tailwind class (`bottom-24`) to a dynamic `style` that accounts for safe area: `bottom: calc(env(safe-area-inset-bottom, 0px) + 84px)` -- this places it comfortably above the nav bar on all devices.

### Bug 2: Gap below nav bar after iOS keyboard dismisses

On iOS PWAs, when the software keyboard opens it resizes the visual viewport. When the keyboard closes (tapping "Done"), iOS sometimes doesn't fully restore the viewport, leaving a blank gap at the bottom and pushing the fixed nav bar up.

**Fix in `src/components/fbs/JournalTab.tsx`**:
- Add a `useEffect` inside the composing view that listens to the `visualViewport` resize event.
- On resize (which fires when the keyboard opens/closes), call `window.scrollTo(0, 0)` to force the browser to recalculate layout.
- Also add `onBlur` handlers on the title input and textarea that trigger a small delayed `window.scrollTo(0, 0)` to nudge iOS into resetting the viewport when the keyboard dismisses.

### Technical Details

**File: `src/components/fbs/JournalTab.tsx`**

1. In the composing view (around line 186), add a `useEffect`:
   - Attach a `resize` listener to `window.visualViewport`
   - On resize, scroll to `(0, document.documentElement.scrollTop)` to force layout recalculation
   - Clean up listener on unmount

2. Add `onBlur` to the title `<input>` (line 207) and the `<textarea>` (line 213):
   - On blur, `setTimeout(() => window.scrollTo(0, 0), 100)` to reset viewport after keyboard hides

3. Change the floating "+" button (line 581):
   - Remove `bottom-24` from className
   - Add to the existing `style` prop: `bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)"`

