

## Apply Smooth Accordion to Previous Sermon Detail Screen

### Problem
The `PreviousSermonDetailScreen.tsx` has its own copy of `AccordionSection` that still uses the old `{open && ...}` conditional rendering -- no smooth close animation and no auto-scroll into view. So when you open a previous sermon and tap Chapters/Scripture/Takeaways, it still glitches on close and doesn't center on screen.

### Solution
Update the `AccordionSection` in `PreviousSermonDetailScreen.tsx` to match the improved version already working in `SermonTab.tsx`:

**File: `src/components/fbs/PreviousSermonDetailScreen.tsx`**

1. Add `useRef` and `useEffect` imports
2. Replace the `AccordionSection` component with the same smooth version:
   - CSS grid-based height transition (`gridTemplateRows: 0fr/1fr`) instead of conditional rendering
   - Opacity fade transition (300ms)
   - `useRef` + `useEffect` to auto-scroll into center of screen after the animation completes
   - Chevron rotation duration updated to 300ms

The content and usage of `AccordionSection` in the JSX stays the same -- only the internal implementation of the component changes.
