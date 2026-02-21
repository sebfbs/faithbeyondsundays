

## Preload FBS Logo to Eliminate Load Delay

### Problem
The FBS logo in the username pill on the public profile screen takes about a second to load, creating a visible pop-in effect that feels laggy.

### Solution
Preload both FBS logo images at app startup so they're already cached in the browser when the public profile is opened.

### Technical Details

**File: `src/App.tsx` (or `src/main.tsx`)**
- Add a preload effect that creates `new Image()` objects for both FBS assets on app mount:
  ```tsx
  useEffect(() => {
    [fbsBg, fbsLogoWhite].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);
  ```
- Import both image assets at the top of the file

This forces the browser to download and cache the images immediately when the app loads, so they render instantly when the profile screen opens. No visible UI change -- just faster image display.

