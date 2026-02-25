

## Fix: Inputs Not Focusable Across Entire iOS PWA

### The Problem
On iOS PWA (home screen app), tapping into any text input or textarea across the app does nothing — the keyboard won't appear. This affects the Auth screen, Home reflection textarea, Journal entry form, and Prayer request form.

### Root Cause
The entire app is wrapped in a container with the CSS class `app-container`, which includes `overflow-x: hidden`. This is a well-documented iOS WebKit bug: when a parent element has `overflow: hidden` (or `overflow-x: hidden`), input elements inside it cannot receive focus in standalone PWA mode (display: standalone).

### The Fix

**File: `src/index.css`** (1 line change)

Remove `overflow-x: hidden` from the `.app-container` class. This single change fixes all inputs app-wide — Auth, Home reflection, Journal, Prayer, and any future inputs.

To prevent any horizontal scroll issues that `overflow-x: hidden` was originally guarding against, we'll add `overflow-x: clip` instead, which prevents visible overflow without triggering the iOS focus bug. If `clip` isn't supported on older browsers, the fallback is no overflow rule at all (the app's `max-width: 430px` constraint already prevents horizontal overflow in practice).

**File: `src/components/fbs/AuthScreen.tsx`** (minor cleanup)

Remove the `animate-fade-in` class from the sign-in/sign-up form container (line 141) as an extra safety measure — CSS animations on containers are another known iOS PWA focus blocker.

### Summary
- 1 CSS property change in `index.css` (swap `overflow-x: hidden` for `overflow-x: clip`)
- 1 class removal in `AuthScreen.tsx` (remove `animate-fade-in` from form view)
- No new files, no new dependencies
- Fixes inputs across the entire app in one shot

