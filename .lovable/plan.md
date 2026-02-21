

## Narrow the Expanded Sidebar

### Change

Reduce the expanded sidebar width from **240px to 180px**. This tightens up the layout and eliminates the excess negative space when the sidebar is open.

### Technical Details

**File: `src/components/fbs/TabletSidebar.tsx`**
- Change `const sidebarWidth = collapsed ? 64 : 240` to `const sidebarWidth = collapsed ? 64 : 180`

**File: `src/pages/Index.tsx`**
- Update the content margin offset from `240` to `180` in the inline style: `marginLeft: sidebarCollapsed ? 64 : 180`

Two lines changed across two files. Everything else stays the same.

