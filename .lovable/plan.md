

## Smart Week-Based Sermon Scheduling

### Current Behavior
Right now, when an admin approves a sermon through the wizard, it **immediately** becomes the live sermon (`is_current = true`). There's no concept of scheduling -- it's a manual toggle. This means if an admin uploads on Sunday, the sermon instantly replaces whatever is currently live, even though the intent is for it to go live the following week.

### New Behavior
Sermons will be tied to a **week range** (Mon-Sun) based on their `sermon_date`. The system will automatically determine which sermon is "current" based on the current date, removing the need for manual "Set as Live" toggling.

### How It Works

1. **When an admin uploads a sermon on Sunday with that day's date**, the sermon's `sermon_date` falls in the upcoming Mon-Sun week. The member app will automatically show it starting Monday.

2. **The member app query** (`useCurrentSermon`) will change from filtering by `is_current = true` to finding the published sermon whose `sermon_date` falls within the current Mon-Sun week.

3. **Previous sermons** will be any published sermon whose week has already passed.

### Database Changes

**Add two new columns to `sermons` table:**
- `week_start` (date) -- computed from `sermon_date`, representing the Monday of that sermon's week
- `week_end` (date) -- the Sunday of that sermon's week

These are set automatically via a trigger whenever `sermon_date` is inserted or updated.

> Note: `is_current` is kept for backward compatibility but will no longer be the primary mechanism for determining what's live.

**New trigger: `set_sermon_week_range`**
```sql
-- On INSERT or UPDATE of sermon_date, compute week_start (Monday) and week_end (Sunday)
NEW.week_start = date_trunc('week', NEW.sermon_date + interval '1 day')::date - interval '1 day'::interval + interval '1 day';
NEW.week_end = NEW.week_start + interval '6 days';
```

**Backfill existing sermons** with computed `week_start` / `week_end` values.

### Frontend Changes

**`src/hooks/useCurrentSermon.ts`**
- Instead of `.eq("is_current", true)`, query for the published sermon where today's date falls between `week_start` and `week_end`
- Fallback: if no sermon matches the current week, show the most recent published sermon (graceful degradation)

**`src/hooks/usePreviousSermons.ts`**
- Filter to published sermons whose `week_end` is before the current week's `week_start` (i.e., past weeks only)
- This prevents showing the "current week" sermon in the previous list

**`src/pages/admin/AdminSermons.tsx`**
- **Approve mutation**: Still sets `is_published = true` and `status = 'complete'`, but no longer needs to toggle `is_current`. The week range handles it automatically.
- **Upload form date field**: Add helper text showing "This sermon will go live for the week of Mon [date] - Sun [date]" based on the selected date
- **Week Timeline component** (from the previous plan): Now powered by real `week_start`/`week_end` data from the database, making it accurate
- **"Set as Live" menu item**: Replace with "Change Sermon Week" -- lets admin reassign a sermon to a different week if needed
- Keep backward compat: if `week_start` is null (old data), fall back to `is_current` logic

### Technical Summary

| Change | File/Location |
|--------|--------------|
| Add `week_start`, `week_end` columns + trigger | Database migration |
| Backfill existing sermons | Database migration |
| Update current sermon query to use week range | `src/hooks/useCurrentSermon.ts` |
| Update previous sermons query | `src/hooks/usePreviousSermons.ts` |
| Remove `is_current` toggling from approve flow | `src/pages/admin/AdminSermons.tsx` |
| Add week helper text to upload form | `src/pages/admin/AdminSermons.tsx` |
| Add Week Timeline visual component | `src/pages/admin/AdminSermons.tsx` |

