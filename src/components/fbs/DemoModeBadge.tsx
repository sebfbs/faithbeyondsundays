import { useNavigate, useLocation } from "react-router-dom";
import { useDemoMode } from "./DemoModeProvider";

export default function DemoModeBadge() {
  const { isDemo, exitDemoUrl, clearDemo } = useDemoMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!isDemo || pathname.startsWith("/platform") || pathname.startsWith("/admin")) return null;

  return (
    <button
      onClick={() => {
        clearDemo();
        navigate(exitDemoUrl);
      }}
      className="fixed top-2 right-2 z-[9999] flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95 opacity-50 hover:opacity-100"
      style={{
        background: "hsl(0 0% 0% / 0.4)",
        color: "hsl(0 0% 100%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      Demo
      <span className="text-[8px] ml-0.5">✕</span>
    </button>
  );
}
