

## Full Tablet Layout for iPad

### What It Does
When someone opens the app on an iPad (768px or wider), they get a sidebar navigation and wider content area. iPhones stay exactly the same -- same bottom nav, same More sheet, same 430px layout. Nothing changes for phone users.

### How It Looks

```text
IPHONE (under 768px) -- NO CHANGES:
+------------------+
|                  |
|   Content Area   |
|   (max 430px)    |
|                  |
|  [Bottom Nav]    |
+------------------+

IPAD (768px and up) -- NEW:
+------------------+------------------------------------+
|                  |                                    |
|   SIDEBAR        |         CONTENT AREA               |
|   (~240px)       |                                    |
|                  |   (Same screens, just wider)        |
|   [FBS Logo]     |                                    |
|                  |                                    |
|   Home           |                                    |
|   Sermon         |                                    |
|   Journal        |                                    |
|   Community      |                                    |
|   Bible          |                                    |
|   Prayer         |                                    |
|   Give           |                                    |
|   ----------     |                                    |
|   Profile        |                                    |
+------------------+------------------------------------+
```

### What Stays the Same (iPhone)
- Bottom navigation bar
- More sheet with Community, Bible, Prayer, Give, Profile
- 430px max-width centered layout
- All screens, overlays, animations, data, localStorage

### Technical Details

**1. New file: `src/components/fbs/TabletSidebar.tsx`**
- Persistent sidebar (~240px) with FBS logo at top
- Navigation items: Home, Sermon, Journal, Community, Bible, Prayer, Give, Profile
- Active state highlighting using the app's accent colors
- Respects existing feature flags (Community, Prayer, Give)
- Profile sits at the bottom, separated from the rest

**2. Update: `src/pages/Index.tsx`**
- Use the existing `useIsMobile()` hook (768px breakpoint) to detect phone vs tablet
- On tablet: render sidebar + content in a flex row; hide BottomNav and MoreSheet
- On phone: everything stays exactly as it is today
- Sidebar clicks use the same navigation logic already in place

**3. Update: `src/index.css`**
- On screens 768px and up, remove the 430px max-width so content fills available space
- Add a readable max-width (e.g. 640px) for text content so it doesn't stretch too wide

**4. Update: `src/components/fbs/BottomNav.tsx`**
- Hide on tablet screens (useIsMobile check)

**5. Content screens (HomeTab, SermonTab, JournalTab, etc.)**
- No major changes -- they already use relative widths
- Add a max-width wrapper inside tabs so text stays readable on wide screens

