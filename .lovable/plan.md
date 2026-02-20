

# Welcome Flow + Feature Flags Implementation

## Overview
Two changes: (1) add admin-controlled feature flags for Groups and Prayer in the More menu, and (2) build a welcome/onboarding flow that users see when they first open the app.

---

## Part 1: Feature Flags for Groups & Prayer (Admin-Controlled)

These flags are NOT user-facing settings. They represent admin decisions made from the church dashboard. Members simply see or don't see these options based on what their church admin has configured.

### New File: `src/components/fbs/featureFlags.ts`
- Create a config object with boolean flags for `groups` and `prayer`
- Both default to `true` for the demo
- Later, these values will come from the database (set by the admin dashboard)

### Modified: `src/components/fbs/MoreSheet.tsx`
- Import feature flags
- Add a `featureKey` property to each menu option
- Filter the options list so Groups/Prayer only appear when their flag is `true`
- Profile always shows

---

## Part 2: Welcome & Onboarding Flow

A multi-step onboarding experience that gates access to the main app.

### New File: `src/components/fbs/WelcomeScreen.tsx`
Three-step flow:

**Step 1 -- Welcome**
- App branding "Faith Beyond Sundays" with the horizon gradient background
- Tagline: "Stay connected to Sunday's message all week long"
- "Get Started" button

**Step 2 -- Church Code**
- Input field for the church code
- Helper text: "Enter the code your church provided"
- On submit, "finds" the matching church and shows its name (e.g., "Cornerstone Community Church")
- For the demo, any code works and maps to the demo church
- "Continue" button after church is confirmed

**Step 3 -- Create Account**
- First name, last name, phone number, and email fields
- Simple validation (required fields, basic email format)
- "Create Account" button
- Saves to localStorage and marks onboarding complete

### Modified: `src/pages/Index.tsx`
- Add `isOnboarded` state checked against localStorage for persistence
- If not onboarded, render WelcomeScreen instead of the main app
- On completion, save user data and show the main app
- Pass user's first name to HomeTab for the greeting

### Modified: `src/components/fbs/HomeTab.tsx`
- Accept a `userName` prop instead of hardcoding "Jordan"
- Display the actual first name in the greeting

### Modified: `src/components/fbs/ProfileScreen.tsx`
- Show user's name and info from onboarding data
- Add "Sign Out" that clears localStorage and returns to Welcome screen

---

## Design Details
- Same horizon gradient and amber accents as the rest of the app
- Rounded inputs and buttons matching existing style (rounded-2xl/3xl)
- Smooth fade transitions between steps
- Mobile-first layout with safe-area padding

## Technical Notes
- User data stored in localStorage as JSON
- Feature flags in a standalone file for easy migration to server-side config later
- No backend dependencies -- everything local for the demo
- Church code validation uses a hardcoded demo lookup map for now

