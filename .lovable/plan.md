

## ChatGPT-Style Sidebar Toggle + Remove App Name

### Changes

**1. Replace toggle icon**
- Swap `ChevronLeft`/`ChevronRight` for `PanelLeftClose`/`PanelLeft` from lucide-react
- Move from floating circle on the edge to an inline button in the header row
- When expanded: toggle sits to the right of the logo
- When collapsed: toggle sits centered above the nav items

**2. Remove "Faith Beyond Sundays" text**
- Keep the accent-colored logo square
- Remove the app name text entirely -- this eliminates the wide header that pushes content down

**3. Clean up nav item styling**
- Increase padding slightly (`py-3`) for larger tap targets
- Use `hover:bg-muted rounded-lg` for hover states
- Keep current accent color for active state but make it subtler

### Technical Details

**File: `src/components/fbs/TabletSidebar.tsx`**
- Replace imports: `ChevronLeft, ChevronRight` becomes `PanelLeftClose, PanelLeft`
- Remove the floating absolute-positioned toggle button
- Add inline toggle button in the header: logo on the left, toggle on the right (expanded) or both centered (collapsed)
- Delete the "Faith Beyond Sundays" span entirely
- Update nav items: add `rounded-lg` and `hover:bg-muted` classes, increase vertical padding
- Keep all existing colors, feature flags, and navigation logic untouched

