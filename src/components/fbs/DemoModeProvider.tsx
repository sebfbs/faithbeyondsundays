import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

interface DemoModeContextValue {
  isDemo: boolean;
  /** URL without demo param (for toggling off) */
  exitDemoUrl: string;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  exitDemoUrl: "/",
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();

  const value = useMemo<DemoModeContextValue>(() => {
    const isDemo = searchParams.get("demo") === "true";
    const cleaned = new URLSearchParams(searchParams);
    cleaned.delete("demo");
    const qs = cleaned.toString();
    return {
      isDemo,
      exitDemoUrl: qs ? `/?${qs}` : "/",
    };
  }, [searchParams]);

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
