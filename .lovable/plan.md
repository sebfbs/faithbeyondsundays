

## Smooth Accordion Animations for Sermon Sections

### Problem
The Chapters, Scripture, and Takeaways accordion sections use conditional rendering (`{open && <div>}`), so when closing, the content is instantly removed from the DOM with no exit animation. The opening has a basic fade-in, but closing just "glitches" away.

### Solution
Replace the manual accordion with a CSS height + opacity transition using `grid` trick (or the Radix Collapsible), so both open and close animate smoothly.

### Changes

**File: `src/components/fbs/SermonTab.tsx` -- AccordionSection component (lines 24-53)**

Replace the current conditional render approach with a CSS-based animated collapse:

1. Always render the content div (don't conditionally remove it from DOM)
2. Use CSS `grid-template-rows: 0fr` / `1fr` transition trick for smooth height animation
3. Add opacity transition for a polished fade effect
4. Keep the chevron rotation animation that already works

The updated `AccordionSection` will look like:

```tsx
function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left tap-active"
      >
        <span className="text-sm font-semibold text-foreground uppercase tracking-widest">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="min-h-0">
          <div className="pb-4 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

This approach:
- Animates height smoothly on both open AND close using the CSS grid row trick
- Fades opacity in and out
- No content "glitch" on close since the DOM element is always present
- Chevron rotation duration bumped to 300ms to match the content animation
