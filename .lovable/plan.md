

# Church Admin Invite System — Final Plan

## Overview
Store the correct Resend API key, build two backend functions, and update the platform dashboard UI so you can assign church admins and send branded invite emails.

## Steps

### 1. Store the Resend API Key
Save `RESEND_API_KEY` as a secure backend secret.

### 2. Create `assign-church-admin` Backend Function
- Accepts `{ church_id, admin_email }`
- Validates caller is a platform admin
- Finds existing user or creates a new one (with email auto-confirmed)
- Assigns "owner" role in `user_roles`
- Creates a profile row linked to the church
- Returns `{ user_id, is_new_user, email }`

### 3. Create `send-admin-invite` Backend Function
- Accepts `{ church_id, church_name, admin_email }`
- Validates caller is a platform admin
- Generates a password recovery link so the admin can set their password
- Sends a branded HTML email via Resend from `Sebastian <sebastian@faithbeyondsundays.com>` with FBS styling and a CTA button

### 4. Update Config
Register both new functions in the backend config.

### 5. Update Create Church Dialog (`PlatformChurches.tsx`)
- Add "Admin Email" field to the form
- After creation, call `assign-church-admin`
- Show success screen with "Send Admin Invite" button
- Button calls `send-admin-invite`, shows toast on success

### 6. Update Church Detail Page (`PlatformChurchDetail.tsx`)
- Add "Church Admin" card showing the current owner's email
- "Change Admin" button to reassign ownership
- "Resend Invite" button to re-send the branded email

## Files Changed
- `supabase/functions/assign-church-admin/index.ts` (new)
- `supabase/functions/send-admin-invite/index.ts` (new)
- `supabase/config.toml` (updated)
- `src/pages/platform/PlatformChurches.tsx` (updated)
- `src/pages/platform/PlatformChurchDetail.tsx` (updated)

