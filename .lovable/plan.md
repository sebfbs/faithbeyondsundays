

# Preserve Profiles and Journal Entries When a Church Is Deleted

## What Changes

When a church is deleted from the platform admin panel, users will keep their **profiles** (including usernames) and **journal entries** instead of losing them. Their `church_id` will simply be set to `NULL`, indicating they're no longer associated with a church.

## What Gets Preserved vs. Deleted

**Preserved (church_id becomes NULL):**
- Profile (username, name, avatar, bio, phone, streaks, etc.)
- Journal entries (reflections, bookmarks, suggested scriptures)

**Still deleted (CASCADE remains -- correct behavior):**
- User roles (admin/member/pastor access revoked)
- Sermons, sermon content, transcripts, sermon jobs
- Prayer requests
- Community groups and group memberships
- Analytics events
- Church feature flags

## Technical Steps

### 1. Database Migration

A single migration that updates two tables:

**profiles.church_id:**
- Make the column nullable (currently `NOT NULL`)
- Drop the existing `ON DELETE CASCADE` foreign key
- Re-add the foreign key with `ON DELETE SET NULL`

**journal_entries.church_id:**
- Make the column nullable (currently `NOT NULL`)
- Drop the existing `ON DELETE CASCADE` foreign key
- Re-add the foreign key with `ON DELETE SET NULL`

### 2. Code Updates

Update code that assumes `church_id` is always present on these tables:

- `src/hooks/useProfile.ts` -- handle `church_id` being `null` (already shows empty string for church name/code when missing, so minimal change)
- `src/hooks/useJournalEntries.ts` -- the `addEntry` mutation currently requires `profile.church_id`; guard against it being `null`
- `src/components/fbs/AuthProvider.tsx` -- ensure auth flow handles profiles with no church gracefully
- RLS policies on `journal_entries` use `user_id = auth.uid()` so they'll continue working regardless of `church_id` value

### 3. No Edge Function Changes Needed

The `get_user_church_id` database function already returns a nullable UUID, so downstream queries will simply return `NULL` for churchless users -- no breakage expected.

