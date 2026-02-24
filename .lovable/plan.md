

## Auto-Scroll Reflection Card into View on Open

When a user taps "Reflect," the reflection card will smoothly scroll to the center of the screen so it's fully visible regardless of current scroll position.

### Approach

Use a React `useRef` on the reflection card container and call `scrollIntoView({ behavior: 'smooth', block: 'center' })` after opening it. A small `setTimeout` (e.g., 100ms) ensures the expanded content has rendered before scrolling.

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**

1. Add a ref: `const reflectionCardRef = useRef<HTMLDivElement>(null);`
2. Attach the ref to both the churched and churchless reflection card wrapper divs
3. Update both "Reflect" button `onClick` handlers to scroll after opening:
   ```tsx
   onClick={() => {
     setReflectionOpen(true);
     setTimeout(() => {
       reflectionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }, 100);
   }}
   ```
4. This works identically on mobile, tablet, and desktop viewports

