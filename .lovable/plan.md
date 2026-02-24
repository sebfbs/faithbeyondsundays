

## Fix: Demo PWA Home Screen Uses Wrong Start URL

### Problem
The `manifest.json` has `"start_url": "/"`. When you tap "Add to Home Screen" on iOS, Safari uses the manifest's `start_url` value — not the current browser URL. So even though you're on `/demo`, iOS saves `/` as the launch URL.

### Solution
Create a second manifest file for demo mode and dynamically swap which manifest the browser sees when you're on the `/demo` route.

### Changes

**New file: `public/manifest-demo.json`**
- Copy of `manifest.json` but with `"start_url": "/demo"` and `"name": "FBS Demo"`
- This tells iOS to save `/demo` as the launch URL

**File: `src/components/fbs/DemoModeProvider.tsx`**
- Add a `useEffect` that swaps the `<link rel="manifest">` tag's `href` attribute:
  - When demo mode is active: set it to `/manifest-demo.json`
  - When not in demo mode: set it to `/manifest.json`
- This runs on mount, so by the time the user taps "Add to Home Screen", the correct manifest is already loaded

### How it works
1. User visits `faithbeyondsundays.app/demo`
2. `DemoModeProvider` detects `/demo` path, activates demo mode
3. The `useEffect` swaps the manifest link to `/manifest-demo.json`
4. User taps Share -> Add to Home Screen
5. iOS reads `start_url: "/demo"` from the demo manifest
6. Home screen shortcut now launches `/demo` correctly

