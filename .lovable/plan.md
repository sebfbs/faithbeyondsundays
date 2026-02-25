

## Fix: Disable Leaked Password Check + Add Friendly Error Message

### The Recommendation

Disable the HIBP (leaked password) check entirely. Your church admins are a small, trusted, invite-only group. The friction of having common passwords rejected is worse than the minimal security risk for this use case -- especially since the app already has role-based access, RLS policies, and invite-only onboarding.

### Two Steps

**Step 1: Backend Configuration (Manual)**

You'll need to disable the leaked password protection in your backend auth settings. I'll open the backend panel for you so you can toggle this off under the authentication security settings.

**Step 2: Friendlier Error Message (Code Change)**

As a safety net, update `src/pages/admin/AdminSetup.tsx` so that if a password rejection error still comes through, admins see a helpful message instead of the raw "known to be weak and easy to guess" text.

In `handleStep2`, replace the raw error display:
```
if (pwError) {
  setError(pwError.message);
```

With a check that catches HIBP-style rejections and shows:
"That password is too common -- try adding a random word or number to make it more unique."

This way even if the backend setting isn't toggled yet (or gets re-enabled later), admins get a clear, non-frustrating explanation.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminSetup.tsx` | Friendlier error message for password rejection in `handleStep2` |
| Backend auth settings | Disable leaked password protection (manual toggle) |

