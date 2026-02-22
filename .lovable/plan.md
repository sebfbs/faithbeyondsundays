
# Multi-Step Admin Setup Wizard with Exciting Username Step

## Overview
Restructure the AdminSetup page into a 3-step wizard, moving password creation to Step 2, and making Step 3 (username selection) feel like a special, celebratory moment.

## Step Breakdown

**Step 1 -- "Welcome"**
- First Name + Last Name
- Warm, simple card with the church icon
- Title: "Welcome!" / Description: "Let's get you set up"
- Button: "Continue"

**Step 2 -- "Your Details"**
- Email (read-only, pre-filled)
- Phone Number
- Password + Confirm Password (only shown if user arrived via invite/recovery link, hidden for Google OAuth users)
- Title: "Contact & Security"
- Button: "Continue"

**Step 3 -- "Claim Your Username" (the exciting one)**
This step gets a completely different visual treatment to feel ethereal and exciting:
- Animated gradient background behind the card (subtle shifting amber/sky-blue aurora effect)
- Large, centered `@username` display that updates live as they type, styled prominently like a profile badge
- Sparkle/star icon instead of the church icon
- Title: "Claim Your @" with a playful description like "Every great name is still available. Pick yours."
- The username input is styled larger and bolder than normal inputs
- On successful submit: confetti burst (using the already-installed `canvas-confetti` package) before navigating to the dashboard
- Button: "Claim @username" (dynamically shows their chosen name)

## Visual Details for Step 3
- Card gets a subtle shimmer/glow border using a CSS gradient animation
- Background uses a radial gradient with soft animated movement (CSS keyframes, no heavy libraries)
- The live `@username` preview above the input scales up slightly with a smooth transition as they type
- Confetti fires on successful profile save using the existing `canvas-confetti` dependency
- Progress dots use the amber accent color for completed steps

## Technical Details

**Files modified:**
- `src/pages/admin/AdminSetup.tsx` -- Complete rewrite as 3-step wizard with:
  - `step` state (1, 2, 3)
  - `password` / `confirmPassword` state (Step 2)
  - `isRecoveryFlow` state to detect if user arrived via invite link (listen for `PASSWORD_RECOVERY` auth event)
  - Password update via `supabase.auth.updateUser({ password })` on Step 2 if in recovery flow
  - Profile update + `onboarding_complete: true` on Step 3 submit
  - Confetti trigger via `canvas-confetti` on success
  - Custom CSS keyframes for the shimmer/glow effect on Step 3's card (inline styles or added to index.css)

- `src/pages/admin/ResetPassword.tsx` -- Delete this file (functionality merged into AdminSetup)
- `src/App.tsx` -- Remove the `/admin/set-password` route
- `src/pages/admin/AdminLogin.tsx` -- Update "Forgot password?" redirect to `/admin/setup`
- `supabase/functions/send-admin-invite/index.ts` -- Update `redirectTo` to point to `/admin/setup`

**No database changes needed** -- all columns already exist.

## Progress Indicator
Three small dots at the top of each card, filled for completed/current steps, outlined for upcoming. Smooth transition between steps with a fade animation using existing `animate-fade-in` class.
