

## Auto-Scroll Accordion Sections into View on Open

### Problem
When you tap Chapters, Scripture, or Takeaways at the top of the Sermon page, the content expands downward but gets cut off below the visible screen area. You have to manually scroll to see it.

### Solution
When a dropdown opens, automatically scroll it into view (centered on screen) after the expand animation finishes.

### Changes

**File: `src/components/fbs/SermonTab.tsx` -- AccordionSection component (lines 24-60)**

1. Add a `useRef` on the accordion container div
2. When `open` becomes `true`, wait for the 300ms animation to complete, then call `scrollIntoView({ behavior: 'smooth', block: 'center' })` to smoothly scroll the section to the center of the screen
3. This keeps the closing behavior unchanged -- only scrolls on open

This is a small change: just adding a ref and a `useEffect` that triggers the scroll after the animation delay.
