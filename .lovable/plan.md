

## Add "Daily Reflection" and "Personal" Journal Categories

### What Changes

There are only two ways to create a journal entry:
1. **Daily Reflection** -- from the guided reflection prompt on the Home screen
2. **Personal** -- from the + button in the Reflection Journal

Currently everything is saved as type "sermon" with a "Sermon" tag. We'll introduce two distinct types and update the filters accordingly.

### Filter Options (new)
- **All** -- shows everything
- **Daily Reflection** -- entries from the Home screen prompt
- **Personal** -- free-form entries from the + button
- **Bookmarked** -- any bookmarked entry

The "Sermon" filter goes away since reflections from the Home screen are tied to sermon content but are better described as "Daily Reflections."

### Demo Entries (new)
Add 2 Daily Reflection demo entries and 2 Personal demo entries so all categories are populated out of the box. Remove or re-tag the existing 3 "Sermon" entries as "Daily Reflection" since they were prompted by sermon content.

---

### Technical Details

**`src/hooks/useJournalEntries.ts`**
- Update `JournalEntry.type` union to `"reflection" | "personal" | "sermon" | "challenge"` (keep old values for backward compat)
- Update `dbToUI` to map entry types to correct tags: `"reflection"` -> "Daily Reflection", `"personal"` -> "Personal"

**`src/components/fbs/JournalTab.tsx`**
- Change `FilterType` to `"all" | "reflection" | "personal" | "bookmarked"`
- Update `filters` array with the new labels
- Update filter logic to match on `entry.type`
- In `handleSaveEntry` (the + button), set `type: "personal"` and `tag: "Personal"`
- Update pill color logic: reflection gets blue pill, personal gets a neutral/green pill

**`src/components/fbs/HomeTab.tsx`**
- Change `entryType` from `"sermon"` to `"reflection"` in both the sermon-linked and churchless reflection paths

**`src/pages/Index.tsx`**
- Update `addJournalEntry` demo handler to respect `entryType` field for setting the correct `type` and `tag`

**`src/components/fbs/demoData.ts`**
- Re-tag existing 3 entries as type `"reflection"`, tag `"Daily Reflection"`
- Add 2 new Personal entries (type `"personal"`, tag `"Personal"`) with free-form content like gratitude notes
