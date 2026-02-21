

## Add Prayer Request Screen

### What It Does
Turns the non-functional "Prayer" button into a simple prayer request submission screen. Members can write what they'd like prayer for, optionally stay anonymous, and submit it. For now, requests are stored locally as a list. Later, this can connect to a database so the prayer team actually receives them.

### Visual Result
- Tapping "Prayer" in the More sheet opens a dedicated Prayer screen (same overlay pattern as Bible, Community, Profile)
- Clean form with a text area for the prayer request
- Optional "Submit anonymously" toggle
- A list of the user's own past submitted requests below the form
- Same frosted-glass card styling as the rest of the app
- Back arrow returns to the previous screen

### Technical Details

**1. `src/components/fbs/PrayerScreen.tsx`** (new file)
- Simple screen component with:
  - Header with back button ("Prayer Requests")
  - Text area input for the request
  - Anonymous toggle (Switch component)
  - Submit button (styled like the Reflect button)
  - List of user's previously submitted requests below, showing date and preview text
  - Requests stored in localStorage for now (`fbs_prayer_requests`)
  - Toast confirmation on submit ("Prayer request submitted")

**2. `src/components/fbs/MoreSheet.tsx`**
- Add `onPrayer` callback prop
- Add handler for the "prayer" key that calls `onPrayer()`

**3. `src/pages/Index.tsx`**
- Add `"prayer"` to the `OverlayScreen` type
- Add `onPrayer` handler to MoreSheet that sets overlay to `"prayer"`
- Render `PrayerScreen` when overlay is `"prayer"`
- Import the new PrayerScreen component

### Data Shape (localStorage for now)
```text
{
  id: string
  text: string
  date: string
  anonymous: boolean
}
```

### Not Included (Future)
- No database storage yet (localStorage only) -- easy to migrate to Supabase later
- No prayer team notification system
- No ability to see other people's requests (privacy first)
- Could add "prayed for you" reactions later

