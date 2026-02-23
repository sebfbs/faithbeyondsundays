

# Updated Value Tour Cards: Daily Sparks vs. Reflections + Notification Setup

## What's Changing

The value tour cards in the member onboarding need to be updated to correctly distinguish Daily Sparks from Guided Reflections, and to let users configure their notification preferences right during onboarding.

## Updated Tour Card Breakdown

### Card 1 -- "Sunday Doesn't End on Sunday"
- Same as before: Re-watch sermons, find key takeaways, stay connected to the message all week
- No changes needed here

### Card 2 -- "Daily Sparks" (UPDATED)
- **Copy clarification**: Daily Sparks are short, impactful daily messages drawn from the sermon -- not journal prompts. Quick hits of inspiration to keep the message alive throughout the week.
- **Interactive notification setup built into the card**:
  - Toggle on/off for Daily Spark notifications
  - Day selector pills (Mon-Sun) so users can pick which days they want sparks -- making it clear it doesn't have to be every day
  - Time-of-day selector (Morning / Midday / Evening)
  - All saved via the existing `useNotificationPreferences` hook
- Copy tone: "Not every day has to be the same. Pick the days and time that work for you."

### Card 3 -- "Guided Reflections" (NEW -- split from Card 2)
- **Separate card** for reflections since they're a different feature
- Copy: Reflections are journal prompts tied to the weekly sermon -- deeper, more personal. They help you process and internalize the message.
- **Same interactive notification setup**: toggle, day pills, time-of-day selector for reflection notifications
- Saved as `daily_reflection` type via the same hook

### Card 4 -- "The Whole Bible, Right Here"
- Same as before: full Bible access at your fingertips

### Card 5 -- "Your Church. Your People."
- Same as before: follow members, connect across churches, community features

## Updated Flow (9 steps total)

```text
[Find Church] -> [About You] -> [Claim Your @] -> Tour 1 -> Sparks -> Reflections -> Bible -> Community -> Done
     1               2              3               4          5           6            7         8          9
```

## Technical Details

### File: `src/components/fbs/OnboardingScreen.tsx`

- Update `Step` type to: `"church" | "details" | "username" | "tour1" | "tour2" | "tour3" | "tour4" | "tour5"`
- Import `useNotificationPreferences` hook
- Import `canvas-confetti`, and icons: `Sparkles`, `BookOpen`, `PenLine`, `Users`, `Play`, `Bell`, `Clock`
- **Tour cards 2 and 3** (Sparks and Reflections) each include:
  - A toggle switch for enabling/disabling notifications
  - Day pills (Mon-Sun) that the user can tap to select/deselect -- reusing the same pill style from `NotificationModals.tsx`
  - Three time-of-day buttons (Morning 8 AM / Midday 12 PM / Evening 6 PM)
  - On "Next", save preferences via `updatePreference()` from the hook
- Profile is saved to database at step 3 (username claim) -- same as current plan
- Tour cards are informational + preference setup, no other database writes
- Final "Let's Go" button triggers `window.location.reload()`
- Progress dots span all 8 steps (church, details, username, 5 tour cards)

### No other files changed
- Reuses existing `useNotificationPreferences` hook as-is
- No database changes needed
- No new dependencies

