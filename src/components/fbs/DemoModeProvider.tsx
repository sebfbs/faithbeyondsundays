import { createContext, useContext, useMemo, useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

const STORAGE_KEY = "fbs_demo_mode";

interface DemoModeContextValue {
  isDemo: boolean;
  exitDemoUrl: string;
  clearDemo: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  exitDemoUrl: "/",
  clearDemo: () => {},
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const value = useMemo<Omit<DemoModeContextValue, "clearDemo">>(() => {
    const urlDemo = searchParams.get("demo") === "true" || location.pathname.startsWith("/demo");

    if (urlDemo) {
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    }

    const isDemo = urlDemo || (() => {
      try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
    })();

    const cleaned = new URLSearchParams(searchParams);
    cleaned.delete("demo");
    const qs = cleaned.toString();
    return {
      isDemo,
      exitDemoUrl: qs ? `/?${qs}` : "/",
    };
  }, [searchParams]);

  const clearDemo = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  // Swap manifest so iOS "Add to Home Screen" uses the correct start_url
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return;
    link.setAttribute("href", value.isDemo ? "/manifest-demo.json" : "/manifest.json");
  }, [value.isDemo]);

  return (
    <DemoModeContext.Provider value={{ ...value, clearDemo }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
