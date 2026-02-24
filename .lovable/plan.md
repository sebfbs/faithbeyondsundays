

# Persist Demo Mode for PWA Home Screen

## Problem
When you "Add to Home Screen" on Safari, the PWA launches using the manifest's `start_url: "/"`, which drops the `?demo=true` query parameter. The app then shows the sign-in screen instead of the demo.

## Solution
Save a flag in localStorage when demo mode is first activated. On future launches (including PWA), check localStorage to restore demo mode even without the URL parameter. Tapping the "Demo x" badge to exit will clear the flag.

## Changes

### File: `src/components/fbs/DemoModeProvider.tsx`

- When URL contains `?demo=true`, write `fbs_demo_mode` = `"true"` to localStorage
- When URL does NOT have the param, check localStorage for the flag -- if found, treat as demo mode
- When exiting demo (via the badge), clear the localStorage flag
- Add a `clearDemo` function to the context so the badge can properly clear it

### File: `src/components/fbs/DemoModeBadge.tsx`

- Use the new `clearDemo` function from the context instead of just navigating away, ensuring localStorage is cleared when exiting demo mode

That's it -- two small file updates, and your PWA home screen shortcut will remember demo mode.

