import { useNavigate } from "react-router-dom";
import { useDemoMode } from "./DemoModeProvider";

/**
 * Floating badge shown when ?demo=true is active.
 * Clicking it navigates to the real app (removes demo param).
 */
export default function DemoModeBadge() {
  const { isDemo, exitDemoUrl } = useDemoMode();
  const navigate = useNavigate();

  if (!isDemo) return null;

  return (
    <button
      onClick={() => navigate(exitDemoUrl)}
      className="fixed top-3 right-3 z-[9999] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
        color: "hsl(var(--primary-foreground))",
        border: "1px solid hsl(var(--primary) / 0.3)",
      }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
      Demo Mode
      <span className="text-[9px] opacity-70 ml-0.5">✕</span>
    </button>
  );
}
