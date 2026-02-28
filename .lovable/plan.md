

## Fix: Regeneration Fails with 401 Unauthorized

### Root Cause

The `process-sermon` edge function has a manual auth check (lines 15-24) that only accepts the **service role key** or the **anon key** as the bearer token. When the browser calls `supabase.functions.invoke("process-sermon", ...)`, it automatically sends the **logged-in user's JWT** -- which matches neither key, causing a 401 response and the "Failed to regenerate" error.

### Fix

Update the auth check in `supabase/functions/process-sermon/index.ts` to also accept valid user JWTs. When the token doesn't match the service role or anon key, verify it as a user JWT using `supabase.auth.getUser(token)`. If that succeeds, the request is authenticated.

### Technical Change

| File | Change |
|------|--------|
| `supabase/functions/process-sermon/index.ts` | Update auth block (lines 15-24): after checking service role and anon key, fall through to `supabase.auth.getUser(token)` to validate user JWTs. Move the Supabase client creation before the auth check so it can be used for JWT verification. |

```text
Auth flow:
  Token matches service role key? --> Allow
  Token matches anon key?         --> Allow
  Token is valid user JWT?        --> Allow (via auth.getUser)
  None of the above?              --> 401 Unauthorized
```

This is a one-line-area change in the edge function. No frontend changes needed -- the regeneration code in `AdminSermons.tsx` is already correct.

