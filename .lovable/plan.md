

## Fix Tablet Sidebar: Fixed Position + Collapsible Toggle

### Problem
The sidebar scrolls away with page content on iPad because the scroll container encompasses the whole layout. Also, the sidebar should be collapsible so users can maximize content space.

### Solution

**1. Make sidebar fixed (not scrollable)**

Update `TabletSidebar.tsx`:
- Change from `sticky top-0` to `fixed left-0 top-0` with `h-dvh` and `z-30`
- Add its own internal `overflow-y-auto` so if nav items exceed screen height, only the sidebar scrolls independently

**2. Add collapse/expand toggle**

- Add a small toggle button (chevron icon) at the top of the sidebar
- Collapsed state shrinks sidebar to ~64px showing only icons (no labels)
- Expanded state shows the full 240px sidebar with icons + labels
- Smooth width transition with CSS
- Store collapsed preference in localStorage so it persists

**3. Offset content area**

Update `Index.tsx` and CSS:
- Add left margin/padding on the content area matching the sidebar width (240px expanded, 64px collapsed)
- Pass collapsed state from sidebar to parent so content area adjusts

### Technical Details

**File: `src/components/fbs/TabletSidebar.tsx`**
- Add `collapsed` / `onToggle` state management
- Change positioning to `fixed left-0 top-0 h-dvh`
- Add a toggle button (ChevronLeft/ChevronRight icon) near the logo
- In collapsed mode: hide labels, shrink to ~64px, center icons
- In expanded mode: show full 240px with labels
- Add `transition-all duration-200` for smooth animation
- Persist collapsed state in localStorage (`fbs_sidebar_collapsed`)

**File: `src/pages/Index.tsx`**
- Add `sidebarCollapsed` state, initialized from localStorage
- Pass it to `TabletSidebar` and use it to set a left margin on the content area (`ml-[240px]` or `ml-[64px]`)

**File: `src/index.css`**
- No major changes needed since positioning moves to component-level classes
