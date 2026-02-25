

## Fix: Dedicated Password Reset Page

### Problem
When an admin clicks "Forgot Password" from the login page, the reset link sends them to `/admin/setup` -- the full 3-step onboarding wizard. They have to re-enter their name, phone, and username just to reset their password.

### Solution
Create a dedicated `/admin/reset-password` page with a single card that only asks for a new password and confirmation. Update the login page to redirect there instead of `/admin/setup`.

### Changes

**1. New file: `src/pages/admin/AdminResetPassword.tsx`**
- Single card matching the admin login page style (gradient background, church icon, card layout)
- Two fields: New Password, Confirm Password
- Calls `supabase.auth.updateUser({ password })` on submit
- Includes the same friendly error handling for weak/common passwords
- On success, shows a toast and redirects to `/admin/login`

**2. Update: `src/pages/admin/AdminLogin.tsx`**
- Change the `redirectTo` in `handleForgotPassword` from `/admin/setup` to `/admin/reset-password`

**3. Update: `src/App.tsx`**
- Add lazy import for `AdminResetPassword`
- Add route `/admin/reset-password`

### Technical Details

The new `AdminResetPassword` component will:
- Use the same `gradient-horizon` background and Card layout as AdminLogin for visual consistency
- Check that the user is authenticated on mount (the recovery link auto-signs them in via the URL hash)
- Validate password length (min 6 chars) and match before submitting
- Handle weak password errors with the friendly message: "That password is too common -- try adding a random word or number to make it more unique."
- After successful update, redirect to `/admin/login` so they can sign in with their new password

| File | Change |
|------|--------|
| `src/pages/admin/AdminResetPassword.tsx` | New -- single-card password reset page |
| `src/pages/admin/AdminLogin.tsx` | Change `redirectTo` to `/admin/reset-password` |
| `src/App.tsx` | Add route + lazy import |

