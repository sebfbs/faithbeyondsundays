

## Fix: iOS Swipe-Back Gesture on Overlay Screens

### Problem
On iOS, swiping from the left edge of the screen triggers the browser's native "back" gesture, which navigates through browser history rather than the app's internal state. Since sub-overlay screens (like Public Profile and Previous Sermon Detail) are managed via React state without corresponding browser history entries, the swipe causes glitches -- blank screens, wrong profiles, or no navigation at all.

### Solution
Push browser history entries when opening sub-overlay screens, and listen for the browser's `popstate` event to properly close them. This makes the iOS swipe-back gesture work naturally with the app's navigation.

### What Changes

**File: `src/pages/Index.tsx`**

1. When opening a public profile (from Community member list), push a history state entry so the browser knows there's a "page" to go back from.

2. When opening a previous sermon detail, do the same.

3. Add a `popstate` event listener that detects when the user swipes back (or taps the browser back button) and properly closes the sub-overlay by resetting state, rather than letting the browser navigate away.

4. Clean up the listener on unmount.

### Technical Detail

```typescript
// When opening a sub-overlay, push history state
const openPublicProfile = (member: CommunityMember) => {
  setSelectedMember(member);
  setSubOverlay("public-profile");
  window.history.pushState({ subOverlay: "public-profile" }, "");
};

const openSermonDetail = (s: SermonUIData) => {
  setSelectedSermon(s);
  setSubOverlay("previous-sermon-detail");
  window.history.pushState({ subOverlay: "previous-sermon-detail" }, "");
};

// Listen for popstate (iOS swipe-back / browser back)
useEffect(() => {
  const handlePopState = () => {
    if (subOverlay) {
      setSubOverlay(null);
      // Prevent further default navigation
    }
  };
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, [subOverlay]);
```

The existing "back arrow" buttons will also be updated to call `window.history.back()` instead of directly setting state, so both the arrow and the swipe gesture use the same code path. This prevents the history stack from getting out of sync.

No other files need to change.
