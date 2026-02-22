import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemoModeProvider } from "@/components/fbs/DemoModeProvider";
import { AuthProvider } from "@/components/fbs/AuthProvider";
import DemoModeBadge from "@/components/fbs/DemoModeBadge";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import fbsBg from "@/assets/FBS_with_grain_and_blue.png";
import fbsLogoWhite from "@/assets/FBS_Logo_white_2.png";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    [fbsBg, fbsLogoWhite].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
            <DemoModeBadge />
            <Routes>
              <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
