import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoModeProvider } from "@/components/fbs/DemoModeProvider";
import { AuthProvider } from "@/components/fbs/AuthProvider";
import DemoModeBadge from "@/components/fbs/DemoModeBadge";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const PlatformLogin = lazy(() => import("./pages/platform/PlatformLogin"));
const PlatformLayout = lazy(() => import("./pages/platform/PlatformLayout"));
const PlatformDashboard = lazy(() => import("./pages/platform/PlatformDashboard"));
const PlatformChurches = lazy(() => import("./pages/platform/PlatformChurches"));
const PlatformChurchDetail = lazy(() => import("./pages/platform/PlatformChurchDetail"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSermons = lazy(() => import("./pages/admin/AdminSermons"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminGroups = lazy(() => import("./pages/admin/AdminGroups"));
const AdminPrayer = lazy(() => import("./pages/admin/AdminPrayer"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSetup = lazy(() => import("./pages/admin/AdminSetup"));

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
              <Route path="/home" element={<Index />} />
              <Route path="/sermon" element={<Index />} />
              <Route path="/journal" element={<Index />} />
              <Route path="/community" element={<Index />} />
              <Route path="/bible" element={<Index />} />
              <Route path="/prayer" element={<Index />} />
              <Route path="/profile" element={<Index />} />
              <Route path="/previous-sermons" element={<Index />} />
              <Route path="/demo" element={<Index />} />
              <Route path="/demo/*" element={<Index />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Platform Owner routes */}
              <Route path="/platform/login" element={<Suspense fallback={null}><PlatformLogin /></Suspense>} />
              <Route path="/platform" element={<Suspense fallback={null}><PlatformLayout /></Suspense>}>
                <Route index element={<PlatformDashboard />} />
                <Route path="dashboard" element={<PlatformDashboard />} />
                <Route path="churches" element={<PlatformChurches />} />
                <Route path="churches/:id" element={<PlatformChurchDetail />} />
              </Route>

              {/* Church Admin routes */}
              <Route path="/admin/login" element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
              
              <Route path="/admin/setup" element={<Suspense fallback={null}><AdminSetup /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={null}><AdminLayout /></Suspense>}>
                <Route index element={<AdminDashboard />} />
                <Route path="sermons" element={<AdminSermons />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="groups" element={<AdminGroups />} />
                <Route path="prayer" element={<AdminPrayer />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

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
