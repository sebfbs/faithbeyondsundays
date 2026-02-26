

## Enforce Lowercase Usernames (Instagram-style)

### Current State
- **OnboardingScreen** (member flow): Already enforces lowercase via `handleUsernameChange` which calls `.toLowerCase().replace(/[^a-z0-9_]/g, "")` -- this is correct.
- **WelcomeScreen** (churchless flow): Also already enforces lowercase the same way -- correct.
- **AdminSetup** (admin onboarding): Does NOT enforce lowercase. The `onChange` handler passes raw input directly to `setUsername` without lowercasing.
- **Database**: No constraint preventing uppercase usernames from being stored.

### Changes

**1. Fix AdminSetup username input** (`src/pages/admin/AdminSetup.tsx`)
- Update the username `onChange` handler to force lowercase and strip invalid characters, matching the same pattern used in the member onboarding:
  ```
  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
  ```

**2. Add database constraint** (migration)
- Add a CHECK constraint on the `profiles.username` column to ensure only lowercase letters, numbers, and underscores are stored:
  ```sql
  ALTER TABLE profiles ADD CONSTRAINT username_lowercase CHECK (username = lower(username));
  ```
- Also run a one-time update to lowercase any existing usernames that may have uppercase characters:
  ```sql
  UPDATE profiles SET username = lower(username) WHERE username != lower(username);
  ```

### Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminSetup.tsx` | Force lowercase + strip invalid chars in username onChange handler |
| Database migration | Add CHECK constraint and normalize existing data |

### What stays the same
- OnboardingScreen and WelcomeScreen already handle this correctly
- ProfileScreen only displays usernames (no editing) so no changes needed
- Search queries already use `.ilike` (case-insensitive) so search will continue working

