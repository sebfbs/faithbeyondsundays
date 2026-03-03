

# Apple App Store Readiness Plan

Based on my deep dive into the codebase, here is the full list of changes needed, organized by priority.

---

## REQUIRED (Apple will reject without these)

### 1. Sign in with Apple

Apple mandates that any app offering third-party social login (you have Google) must also offer Sign in with Apple. Your `lovable` integration already supports `"apple"` as a provider but the UI has no Apple button.

**Changes:**
- Add a "Continue with Apple" button to `AuthScreen.tsx` (welcome screen + sign-in/sign-up forms) calling `lovable.auth.signInWithOAuth("apple", ...)`
- Configure Apple credentials in the backend (managed by Lovable Cloud or BYOC via the backend dashboard)

---

### 2. Account Deletion

Apple requires apps with account creation to let users delete their account from within the app. There is currently no delete account button anywhere in the app.

**Changes:**
- Add a "Delete Account" button with confirmation dialog at the bottom of `ProfileScreen.tsx`
- Create a `delete-account` edge function that deletes the user's profile, journal entries, prayer requests, notification preferences, device tokens, follows, badges, analytics events, and finally the auth account
- Wire the button to call the edge function, then sign the user out

---

### 3. Report & Block for User-Generated Content

The app has community posts, prayer requests, group chat, and public profiles. Apple Guideline 1.2 requires report/block mechanisms for UGC apps. There is zero report or block functionality currently.

**Changes:**
- Create `content_reports` and `blocked_users` database tables
- Add "Report" and "Block User" options to community posts, prayer requests, group chat messages, and public profiles (via a bottom sheet or context menu)
- Filter out content from blocked users in all feeds
- Add a moderation queue to the admin dashboard for reviewing reports

---

### 4. Terms & Privacy Links on Auth Screen

Apple reviewers verify that Terms and Privacy are accessible before sign-up. Your auth screen has no links to `/terms` or `/privacy`.

**Changes:**
- Add "By signing up, you agree to our Terms of Service and Privacy Policy" text with links on the AuthScreen welcome view and sign-up form

---

### 5. Capacitor Native Shell

To submit to the App Store you need a native iOS wrapper. There is no `capacitor.config.ts` in the project.

**Changes:**
- Create `capacitor.config.ts` with the correct appId, appName, and server URL
- The actual Xcode build, signing, and submission must be done on your Mac locally (export to GitHub, `npx cap add ios`, build in Xcode)

---

## RECOMMENDED (reduces rejection risk)

### 6. Age Verification

Your Terms say users must be 13+, but there is no enforcement. Apple may flag this given the social/community features.

**Changes:**
- Add a date-of-birth or "I am 13 or older" confirmation step during onboarding (first step of `OnboardingScreen.tsx`)
- Block account creation if under 13

---

### 7. Community Guidelines Acknowledgment

Apple Guideline 1.2 also requires that users agree to community guidelines before posting. You have a `CommunityGuidelinesDialog` but it is not shown as a gate.

**Changes:**
- Show the community guidelines dialog the first time a user accesses community features, requiring acceptance before they can post

---

## INFORMATIONAL (no code changes, done in App Store Connect)

### 8. Privacy Nutrition Labels

You must declare data collection in App Store Connect:
- **Contact Info**: Email, name, phone (optional)
- **User Content**: Journal entries, prayer requests
- **Usage Data**: Analytics events
- **Identifiers**: Device tokens for push notifications
- **Photos**: Avatar uploads

No code change needed -- just fill in the App Privacy section accurately in App Store Connect.

---

## Implementation Order

I recommend implementing in this order across multiple sessions:

| Step | Item | Scope |
|------|------|-------|
| 1 | Sign in with Apple + Terms/Privacy links on auth | `AuthScreen.tsx` + backend config |
| 2 | Account deletion | `ProfileScreen.tsx` + new edge function + DB cleanup |
| 3 | Report & Block | New DB tables + UI across 4 screens + admin moderation |
| 4 | Capacitor config | `capacitor.config.ts` |
| 5 | Age verification | `OnboardingScreen.tsx` |
| 6 | Community guidelines gate | `CommunityScreen.tsx` |

Want me to start with Step 1 (Sign in with Apple + Terms/Privacy links)?

