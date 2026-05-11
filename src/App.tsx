import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
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
import ChurchGateway from "./pages/ChurchGateway";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ResetPassword from "./pages/ResetPassword";
import VerifyProfilePage from "./pages/VerifyProfilePage";
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
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSetup = lazy(() => import("./pages/admin/AdminSetup"));
const AdminResetPassword = lazy(() => import("./pages/admin/AdminResetPassword"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));

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
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="fbs-theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoModeProvider>
            <DemoModeBadge />
            <Routes>
              <Route path="/" element={<ChurchGateway />} />
              <Route path="/app" element={<Index />} />
              <Route path="/home" element={<Index />} />
              <Route path="/sermon" element={<Index />} />
              <Route path="/journal" element={<Index />} />
              <Route path="/community" element={<Index />} />
              <Route path="/bible" element={<Index />} />
              <Route path="/prayer" element={<Index />} />
              <Route path="/profile" element={<Index />} />
              <Route path="/previous-sermons" element={<Index />} />
              <Route path="/community-groups" element={<Index />} />
              <Route path="/demo" element={<Index />} />
              <Route path="/demo/*" element={<Index />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-profile" element={<VerifyProfilePage />} />

              {/* Platform Owner routes */}
              <Route path="/platform/login" element={<Suspense fallback={<div className="min-h-screen bg-slate-950" />}><PlatformLogin /></Suspense>} />
              <Route path="/platform" element={<Suspense fallback={<div className="min-h-screen bg-slate-950" />}><PlatformLayout /></Suspense>}>
                <Route index element={<PlatformDashboard />} />
                <Route path="dashboard" element={<PlatformDashboard />} />
                <Route path="churches" element={<PlatformChurches />} />
                <Route path="churches/:id" element={<PlatformChurchDetail />} />
              </Route>

              {/* Church Admin routes */}
              <Route path="/admin/login" element={<Suspense fallback={<div className="admin-root min-h-screen bg-background" />}><AdminLogin /></Suspense>} />
              
              <Route path="/admin/setup" element={<Suspense fallback={<div className="admin-root min-h-screen bg-background" />}><AdminSetup /></Suspense>} />
              <Route path="/admin/reset-password" element={<Suspense fallback={<div className="admin-root min-h-screen bg-background" />}><AdminResetPassword /></Suspense>} />
              <Route path="/admin" element={<Suspense fallback={<div className="admin-root min-h-screen bg-background" />}><AdminLayout /></Suspense>}>
                <Route index element={<AdminDashboard />} />
                <Route path="sermons" element={<AdminSermons />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="groups" element={<AdminGroups />} />
                <Route path="prayer" element={<AdminPrayer />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="team" element={<AdminTeam />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DemoModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
