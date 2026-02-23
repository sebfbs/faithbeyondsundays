

# "Everyone In" — Church Search with Optional Request

## Summary
When a user searches for their church and it isn't found, they'll see **two options side by side**: "Request Your Church" and a "Continue" button. After submitting a request, the confirmation screen also shows a "Continue" button alongside "Back to Search." This ensures every user can proceed through onboarding regardless of whether their church is on the platform, without forcing them to submit a request.

## Changes

### 1. OnboardingScreen.tsx — "No Results" State (lines ~400-410)
Currently shows only "Request Your Church" link. Add a "Continue" button below/beside it so users can proceed without requesting.

**Before:**
- "Don't see your church?"
- "Request Your Church" link

**After:**
- "Don't see your church?"
- "Request Your Church" button (styled as secondary/text)
- "Continue without a church" button (styled as amber primary)

### 2. OnboardingScreen.tsx — "Request Submitted" State (lines ~306-321)
Currently shows only "Back to Search." Add a "Continue" button so users can move forward after submitting.

**Before:**
- "We're on it!" confirmation
- "Back to Search" link

**After:**
- "We're on it!" confirmation
- "Continue" primary button (advances to `details` step with `selectedChurch = null`)
- "Back to Search" text link

### 3. OnboardingScreen.tsx — handleClaimUsername (line 244)
Remove the `!selectedChurch` guard so users without a church can complete onboarding.

**Before:** `if (!user || !selectedChurch || !username || usernameError) return;`
**After:** `if (!user || !username || usernameError) return;`

Also update the insert to use `church_id: selectedChurch?.id || null`.

### 4. Index.tsx — Analytics Guard (line ~78)
Skip the `analytics_events` insert when `profile.church_id` is null (since that column is NOT NULL).

### 5. Remaining "Everyone In" Changes
The rest of the churchless experience (HomeTab, SermonTab, MoreSheet, TabletSidebar, CommunityScreen, ProfileScreen, useFeatureFlags, dailyVerse utility) will follow the previously agreed plan — this change just handles the onboarding entry point.

## Technical Details

### OnboardingScreen.tsx — No Results Section (~line 401)
Replace the current "Don't see your church?" block with:
- A "Request Your Church" text button (keeps existing behavior)
- A "Continue" amber button that sets `selectedChurch = null` and calls `setStep("details")`

### OnboardingScreen.tsx — Request Submitted Section (~line 306)
Add a "Continue" amber button after the confirmation message that sets `selectedChurch = null` and calls `setStep("details")`.

### OnboardingScreen.tsx — handleClaimUsername (~line 243-256)
- Change guard: `if (!user || !username || usernameError) return;`
- Change insert: `church_id: selectedChurch?.id || null`

### Index.tsx — Analytics (~line 75-80)
Wrap the analytics insert in a `if (profile.church_id)` check.

