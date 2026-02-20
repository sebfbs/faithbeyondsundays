

# Add Back Buttons to Onboarding Steps

## What This Does
Adds a back arrow button to Step 2 (Find Your Church) and Step 3 (Create Account) so you can navigate backwards through the onboarding flow.

## Changes

### Modified: `src/components/fbs/WelcomeScreen.tsx`
- Import the `ArrowLeft` icon from lucide-react
- **Step 2 (Find Your Church)**: Add a back button in the top-left that returns to Step 1 (Welcome)
- **Step 3 (Create Account)**: Add a back button in the top-left that returns to Step 2 (Church Code)
- The back button is a simple arrow icon, positioned at the top of the screen above the heading, matching the style used elsewhere in the app (e.g., the guided reflection back button)

