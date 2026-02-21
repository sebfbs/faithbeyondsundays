

## Fill the Empty Space on Home Screen

### What's Changing
Adding two new sections below the existing Reflection card to fill the empty space on mobile:

1. **Scripture of the Day** -- A card showing one of the sermon's key scripture passages, rotating daily. Styled to match the existing cards with a clean, elegant look. Tapping "Read in Bible" could navigate to the Bible tab in the future.

2. **Quick Links** -- A row of 3 shortcut buttons (Bible, Prayer, Community) styled as small rounded cards with icons. These give users fast access to other parts of the app without scrolling through the bottom nav.

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**
- Import additional icons: `BookOpen`, `Heart`, `Users`, `ChevronRight`
- Add a **"Scripture of the Day"** card after the Reflection card:
  - Picks a scripture from `SERMON.scriptures` based on the day of the week (rotating)
  - Shows the reference as a header and the verse text in a slightly larger, italic style
  - Same frosted glass card styling as existing cards (rounded-3xl, blur backdrop)
  - Small label "From Sunday's sermon" at the bottom
- Add a **"Quick Links"** row after the scripture card:
  - Three tappable cards in a horizontal grid (grid-cols-3, gap-3)
  - Each card: icon + label, frosted glass background, rounded-2xl
  - Links: Bible, Prayer, Community
  - These will call `onTabChange` or a new `onNavigate` callback prop to switch to the correct screen

**File: `src/components/fbs/HomeTab.tsx` -- Props update**
- Add an optional `onNavigate?: (screen: string) => void` prop to HomeTabProps so the quick links can trigger navigation to Bible, Prayer, or Community screens

No new files needed. No CSS changes needed -- existing Tailwind classes cover everything.
