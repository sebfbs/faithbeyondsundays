

## Fix: Daily Sparks Card Flashing on Interaction

### Problem
On the Daily Sparks onboarding card (tour2 step), pressing any button -- day pills, time of day, or the notification toggle -- causes the entire page to visually "flash" and smoothly re-animate. This happens because the `animate-fade-in` CSS class (which runs a 0.4s opacity + translateY animation) is applied to both the TourCard container and the NotificationSetup component, and is replaying during interactions.

### Root Cause
The `NotificationSetup` component wraps its content in a div with `animate-fade-in` (line 63). Additionally, the conditional `{enabled && (...)}` block inside it causes its children to unmount/remount when the notification toggle is flipped, re-triggering fade animations. The TourCard wrapper also has `animate-fade-in`, and React's reconciliation on state changes may cause animation replay in certain scenarios.

### Solution
Remove the `animate-fade-in` class from the `NotificationSetup` component's wrapper div, and replace the conditional mount/unmount of the days/time content with a simple visibility/opacity approach so toggling the switch doesn't cause a jarring re-mount animation.

### Changes

**1. `src/components/fbs/OnboardingScreen.tsx`**

- **NotificationSetup component (line 63):** Remove `animate-fade-in` from the outer div class, changing it from `"space-y-4 animate-fade-in"` to just `"space-y-4"`.
- **Conditional content (line 73):** Keep the `{enabled && (...)}` pattern but remove any animation classes from the revealed content so day/time sections simply appear without a fade-in animation replay.

These are minimal, targeted changes -- the initial fade-in when entering the tour2 step will still work (from the TourCard wrapper), but interacting with buttons within the card will no longer re-trigger animations.
