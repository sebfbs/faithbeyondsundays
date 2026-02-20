

# Replace Church Icon with FBS Logo on Welcome Screen

## What This Does
Replaces the Church icon on the Welcome screen (Step 1) with the uploaded FBS logo image.

## Changes

### Copy Asset
- Copy `user-uploads://FBS_Logo_white.png` to `src/assets/FBS_Logo_white.png`

### Modified: `src/components/fbs/WelcomeScreen.tsx`
- Import the logo: `import fbsLogo from "@/assets/FBS_Logo_white.png"`
- Replace the icon container (the rounded box with the Church icon) with the logo image
- Remove the `Church` import from lucide-react (if no longer used elsewhere in the file -- it's still used in Step 2, so keep it)
- Display the logo at a larger size since it's a proper brand logo (e.g., `w-24 h-24` or similar)

