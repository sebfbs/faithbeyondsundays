

## Remove Guided Reflection Push Notifications

You're spot on -- two daily push notifications is too aggressive and will lead to users muting everything. One meaningful daily touchpoint (the Daily Spark) is the sweet spot. Reflections should live as a natural in-app experience, not an interruption.

### What Changes

**1. Onboarding -- Remove the Guided Reflections notification setup step**
- Remove the entire "tour3" step (the Guided Reflections notification config screen with days/time pickers shown in your screenshot)
- Update the step flow: tour2 (Daily Sparks) will skip directly to tour4 (The Whole Bible) instead of going to tour3
- Remove the `handleSaveReflectionPrefs` function and related state variables (`reflectionEnabled`, `reflectionDays`, `reflectionTime`)
- Update the STEPS array to remove "tour3" and update the progress dots accordingly

**2. Profile Settings -- Remove the Daily Reflection notification row**
- Remove the "Daily Reflection" toggle and its schedule picker from the notification settings section in ProfileScreen
- Keep only: New Sermon, Daily Spark, New Follower, Someone Prayed for You, Sermon Processing Complete

**3. Notification Preferences Hook -- Remove daily_reflection type**
- Remove `"daily_reflection"` from the `ALL_TYPES` array and `NotificationType` union
- This means it won't show up anywhere and won't be saved/fetched

**4. Reflections stay in the app**
- The Guided Reflection card on the Home tab stays exactly as-is -- users still see and interact with reflections daily
- It just won't send a push notification about it

### Technical Details

**OnboardingScreen.tsx:**
- Remove `reflectionEnabled`, `reflectionDays`, `reflectionTime` state
- Remove `handleSaveReflectionPrefs` function
- Remove the `step === "tour3"` block entirely
- Change `handleSaveSparkPrefs` to call `setStep("tour4")` instead of `setStep("tour3")`
- Remove "tour3" from `STEPS` array and `Step` type
- Renumber remaining steps so progress dots are correct

**ProfileScreen.tsx:**
- Remove the "Daily Reflection" `NotifRow` and its associated `NotifScheduleRow`
- Remove any `daysModal === "daily_reflection"` and `timeModal === "daily_reflection"` references

**useNotificationPreferences.ts:**
- Remove `"daily_reflection"` from `NotificationType` union and `ALL_TYPES` array

