

## Replace "Challenge Accepted" Badge with Reflection Badge

### What Changes

The "Challenge Accepted / First Challenge" badge on the Profile screen no longer applies since the Weekly Challenge was removed. It will be replaced with a badge that celebrates the daily reflection habit.

### New Badge

| Field | Old Value | New Value |
|-------|-----------|-----------|
| Icon | Award | BookOpen (or similar) |
| Label | "Challenge Accepted" | "First Reflection" |
| Detail | "First Challenge" | "Daily Journaler" |
| Color | hsl(340 70% 55%) | hsl(340 70% 55%) (keep same) |

### Technical Details

**File: `src/components/fbs/ProfileScreen.tsx`**

1. Replace the `Award` import with `BookOpen` from lucide-react (or keep `Award` if preferred)
2. Update line 20 from:
   ```
   { icon: Award, label: "Challenge Accepted", detail: "First Challenge", color: "hsl(340 70% 55%)" }
   ```
   to:
   ```
   { icon: BookOpen, label: "First Reflection", detail: "Daily Journaler", color: "hsl(340 70% 55%)" }
   ```

One line change, no other files affected.

