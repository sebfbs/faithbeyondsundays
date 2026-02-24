

## Fix: Demo Mode PWA Home Screen Shortcut

### Problem
iOS Safari strips query parameters when saving a page to the home screen. So `faithbeyondsundays.app?demo=true` gets saved as just `faithbeyondsundays.app`, and demo mode doesn't activate on launch.

### Solution
Make `/demo` a real route that renders the app directly (not a redirect), so iOS saves the clean `/demo` path with no query params to strip.

### Changes

**File: `src/components/fbs/DemoModeProvider.tsx`**
- Import `useLocation` from react-router-dom
- In the `useMemo`, also check if `location.pathname` starts with `/demo` as a demo trigger (in addition to the existing `?demo=true` query param)
- This means opening `/demo` or `/demo/journal` etc. will activate demo mode and persist it to localStorage

**File: `src/App.tsx`**
- Change the `/demo` route from `<Navigate to="/home?demo=true" replace />` to `<Index />` (render the app directly)
- Change `/demo/*` similarly — render `<Index />` instead of redirecting
- This gives iOS a clean URL path to save to the home screen

### How it works
1. User visits `faithbeyondsundays.app/demo` in Safari
2. The app renders directly at `/demo` (no redirect)
3. `DemoModeProvider` sees the `/demo` path and activates demo mode, persisting to localStorage
4. User taps "Add to Home Screen" — iOS saves `/demo` (clean path, nothing to strip)
5. Future launches from the home screen open `/demo`, demo mode activates reliably

