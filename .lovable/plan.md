

## Scroll to Top on Tab Change

### What Changes

**`src/pages/Index.tsx`**
- Add a `ref` to the `<main>` scrollable container
- In the `handleTabChange` function, call `scrollTo(0, 0)` on the main element whenever the user switches tabs
- Also reset scroll when navigating to/from overlay screens (Bible, Profile, Community, etc.)

### Technical Detail

```tsx
const mainRef = useRef<HTMLDivElement>(null);

const handleTabChange = (tab: TabId) => {
  // Reset scroll position
  mainRef.current?.scrollTo(0, 0);
  window.scrollTo(0, 0);
  // ...existing tab logic
};
```

Both `mainRef.scrollTo` and `window.scrollTo` are called to cover whichever element is actually scrolling (the main container or the window itself). The same reset is added when overlay screens open/close.

