

# Making FBS Operational — Wire Real Data

## Goal
Replace all hardcoded/demo data with live database content so when an admin uploads a sermon and it gets processed, members actually see it. This is the critical path to showing the app to real churches.

## Priority Order

### 1. Wire Sermon Content from Database
**The most important change.** Currently, `HomeTab`, `SermonTab`, and `PreviousSermonsListScreen` all read from the hardcoded `SERMON` constant in `data.ts`.

**What changes:**
- Create a `useCurrentSermon` hook that fetches the church's current sermon (`is_current = true, is_published = true`) and its `sermon_content` rows
- Transform the DB content types (`spark`, `takeaways`, `reflection_questions`, `scriptures`, `chapters`, `weekly_challenge`, `weekend_reflection`) into the shape the UI expects
- Update `HomeTab` to use real spark, scripture of the day, and reflection questions
- Update `SermonTab` to show real sermon title/date/speaker/chapters/scriptures/takeaways
- Create a `usePreviousSermons` hook for the previous sermons list
- Show a graceful empty state when no sermon has been uploaded yet ("Your pastor hasn't uploaded a sermon yet")

### 2. Wire Journal Entries to Database
Currently journal entries live in React state and reset on refresh.

**What changes:**
- Create a `useJournalEntries` hook that reads/writes to the `journal_entries` table
- Save reflections and challenge completions to the DB
- Load existing entries on mount
- Support bookmark toggle, edit, and delete via DB mutations

### 3. Wire Feature Flags from Database
The admin panel can toggle feature flags, but the member app ignores them.

**What changes:**
- Create a `useFeatureFlags` hook that reads from `church_feature_flags` for the user's church
- Falls back to defaults (all enabled) if no overrides exist
- Use it in `BottomNav`, `MoreSheet`, `TabletSidebar`, and `HomeTab` quick links to hide/show community, prayer, and giving

### 4. Clean Up Hardcoded Data
- Remove the static `SERMON`, `PREVIOUS_SERMONS`, and `JOURNAL_ENTRIES` from `data.ts` (keep only `GIVING_URL` or wire that from church settings too)
- Remove `featureFlags.ts` static export

---

## Technical Details

### New Files
- `src/hooks/useCurrentSermon.ts` — fetches current published sermon + sermon_content for user's church
- `src/hooks/usePreviousSermons.ts` — fetches past published sermons + their content
- `src/hooks/useJournalEntries.ts` — CRUD for journal_entries table
- `src/hooks/useFeatureFlags.ts` — reads church_feature_flags with defaults

### Modified Files
- `src/components/fbs/HomeTab.tsx` — accept sermon data as props instead of importing SERMON
- `src/components/fbs/SermonTab.tsx` — accept sermon data as props
- `src/components/fbs/JournalTab.tsx` — use DB-backed entries
- `src/pages/Index.tsx` — orchestrate hooks and pass data down
- `src/components/fbs/BottomNav.tsx` — respect feature flags
- `src/components/fbs/MoreSheet.tsx` — respect feature flags
- `src/components/fbs/TabletSidebar.tsx` — respect feature flags
- `src/components/fbs/PreviousSermonsListScreen.tsx` — use DB data
- `src/components/fbs/data.ts` — remove hardcoded sermon/journal data

### Data Shape Mapping
The `process-sermon` edge function generates these `sermon_content` types, which map to the UI like this:

- `spark` -> HomeTab "Today's Spark" card (title + summary)
- `reflection_questions` -> HomeTab daily reflection + prompts
- `scriptures` -> HomeTab scripture of the day + SermonTab scripture accordion
- `takeaways` -> SermonTab takeaways accordion
- `chapters` -> SermonTab chapters accordion
- `weekly_challenge` -> SermonTab/JournalTab challenge
- `weekend_reflection` -> HomeTab weekend prompt

### Empty States
When no sermon exists yet for a church:
- HomeTab shows a welcome message instead of spark/reflection cards
- SermonTab shows "No sermon yet — check back after Sunday!"
- Previous sermons shows empty list

### Demo Mode
Demo mode (`?demo=true`) will continue to use hardcoded data so the app is always showable without real content. The static data moves to a `demoData.ts` file used only in demo mode.
