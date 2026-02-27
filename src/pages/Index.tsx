import { useState, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import BottomNav, { TabId } from "@/components/fbs/BottomNav";
import HomeTab, { getSkyGradient } from "@/components/fbs/HomeTab";
import SermonTab from "@/components/fbs/SermonTab";
import JournalTab from "@/components/fbs/JournalTab";
import BibleScreen from "@/components/fbs/BibleScreen";
import ProfileScreen from "@/components/fbs/ProfileScreen";
import MoreSheet from "@/components/fbs/MoreSheet";
import PreviousSermonsListScreen from "@/components/fbs/PreviousSermonsListScreen";
import PreviousSermonDetailScreen from "@/components/fbs/PreviousSermonDetailScreen";
import CommunityScreen from "@/components/fbs/CommunityScreen";
import PrayerScreen from "@/components/fbs/PrayerScreen";
import PublicProfileScreen from "@/components/fbs/PublicProfileScreen";
import AuthScreen from "@/components/fbs/AuthScreen";
import OnboardingScreen from "@/components/fbs/OnboardingScreen";
import TabletSidebar, { SidebarNavTarget } from "@/components/fbs/TabletSidebar";
import { GIVING_URL } from "@/components/fbs/data";
import type { SermonUIData } from "@/hooks/useCurrentSermon";
import type { CommunityMember } from "@/components/fbs/communityData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoMode } from "@/components/fbs/DemoModeProvider";
import { useAuth } from "@/components/fbs/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentSermon } from "@/hooks/useCurrentSermon";
import { usePreviousSermons } from "@/hooks/usePreviousSermons";
import { useJournalEntries, type JournalEntry } from "@/hooks/useJournalEntries";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { DEMO_SERMON, DEMO_PREVIOUS_SERMONS, DEMO_JOURNAL_ENTRIES } from "@/components/fbs/demoData";
import type { UserData } from "@/components/fbs/WelcomeScreen";
import { Loader2 } from "lucide-react";

type OverlayScreen =
  | "profile"
  | "previous-sermons-list"
  | "previous-sermon-detail"
  | "community"
  | "public-profile"
  | "bible"
  | "prayer"
  | null;

export type { JournalEntry } from "@/hooks/useJournalEntries";

export default function Index() {
  const { isDemo } = useDemoMode();
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const topBarRatio = useMemo(() => Math.min(scrollY / 60, 1), [scrollY]);

  // Real data hooks (only active when not in demo mode)
  const { data: currentSermon, isLoading: sermonLoading } = useCurrentSermon();
  const { data: previousSermons } = usePreviousSermons();
  const { entries: dbJournalEntries, addEntry, updateEntry, deleteEntry, toggleBookmark } = useJournalEntries();
  const dbFeatureFlags = useFeatureFlags();
  // In demo mode, unlock all features regardless of church connection
  const featureFlags = isDemo ? { community: true, prayer: true, giving: true } : dbFeatureFlags;

  // Demo mode data
  const [demoJournalEntries, setDemoJournalEntries] = useState<JournalEntry[]>(DEMO_JOURNAL_ENTRIES);

  // Resolve data source
  const sermon: SermonUIData | null = isDemo ? DEMO_SERMON : (currentSermon || null);
  const prevSermons: SermonUIData[] = isDemo ? DEMO_PREVIOUS_SERMONS : (previousSermons || []);
  const journalEntries: JournalEntry[] = isDemo ? demoJournalEntries : dbJournalEntries;

  // Log app_open event once per session
  useEffect(() => {
    if (!profile || isDemo || !profile.church_id) return;
    const key = "fbs_app_open_logged";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .from("analytics_events")
      .insert({ church_id: profile.church_id, user_id: authUser!.id, event_type: "app_open" })
      .then(() => {});
  }, [profile, isDemo, authUser]);

  // Derive active screen from URL path
  const pathScreen = location.pathname.replace(/^\//, "") || "home";
  const tabScreens = ["home", "sermon", "journal"];
  const overlayScreens = ["community", "bible", "prayer", "profile", "previous-sermons"];

  const activeTab: TabId = tabScreens.includes(pathScreen) ? (pathScreen as TabId) :
    overlayScreens.includes(pathScreen) ? "more" : "home";
  const overlay: OverlayScreen = overlayScreens.includes(pathScreen) ?
    (pathScreen === "previous-sermons" ? "previous-sermons-list" : pathScreen as OverlayScreen) : null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("fbs_sidebar_collapsed") === "true"; } catch { return false; }
  });

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fbs_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<SermonUIData | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [subOverlay, setSubOverlay] = useState<"previous-sermon-detail" | "public-profile" | null>(null);
  const subOverlayRef = useRef(subOverlay);
  subOverlayRef.current = subOverlay;
  const mainRef = useRef<HTMLDivElement>(null);

  // Sync sub-overlay screens with browser history for iOS swipe-back
  useEffect(() => {
    const handlePopState = () => {
      if (subOverlayRef.current) {
        setSubOverlay(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, []);

  const navTo = useCallback((path: string) => {
    const search = isDemo ? "?demo=true" : "";
    navigate(path + search);
    setSubOverlay(null);
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [navigate, isDemo]);

  // Build UserData
  const userData: UserData | null = isDemo
    ? {
        firstName: "Grace", lastName: "Demo", username: "grace_demo",
        churchCode: "cornerstone", churchName: "Cornerstone Community Church",
        phone: "", email: "",
      }
    : profile
    ? {
        firstName: profile.first_name || "", lastName: profile.last_name || "",
        username: profile.username, churchCode: profile.church_code || "",
        churchName: profile.church_name || "", phone: "",
        email: authUser?.email || "", avatarUrl: profile.avatar_url || undefined,
        instagramHandle: profile.instagram_handle || undefined,
        phoneNumber: profile.phone_number || undefined,
      }
    : null;

  // Loading state
  if (!isDemo && authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <Loader2 size={32} className="animate-spin text-amber" />
      </div>
    );
  }

  if (!isDemo && !authUser) return <AuthScreen />;

  if (!isDemo && !profileLoading && !profile) return <OnboardingScreen />;

  if (!isDemo && profileLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <Loader2 size={32} className="animate-spin text-amber" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navTo("/home");
    setMoreOpen(false);
  };

  const addJournalEntry = (entry: any) => {
    if (isDemo) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const entryType = entry.entryType === "personal" ? "personal" : "reflection";
      const tag = entryType === "personal" ? "Personal" : "Daily Reflection";
      setDemoJournalEntries((prev) => [{
        id: `demo-${Date.now()}`,
        date: dateStr,
        type: entryType as "reflection" | "personal",
        tag,
        preview: (entry.content || "").slice(0, 120),
        sermonTitle: entry.title || "Reflection",
        bookmarked: false,
        fullText: entry.content || "",
      }, ...prev]);
    } else {
      addEntry.mutate(entry);
    }
  };

  const handleUpdateEntry = (updated: JournalEntry) => {
    if (isDemo) {
      setDemoJournalEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      updateEntry.mutate({ id: updated.id, content: updated.fullText, title: updated.sermonTitle, isBookmarked: updated.bookmarked });
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (isDemo) {
      setDemoJournalEntries((prev) => prev.filter((e) => e.id !== id));
    } else {
      deleteEntry.mutate(id);
    }
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === "more") { setMoreOpen(true); return; }
    scrollToTop();
    setMoreOpen(false);
    navTo(`/${tab}`);
  };

  const handleSidebarNavigate = (target: SidebarNavTarget) => {
    scrollToTop();
    setMoreOpen(false);
    navTo(`/${target}`);
  };

  const activeSidebarItem: string = overlay || activeTab;

  const renderMain = () => {
    if (!userData) return null;

    if (subOverlay === "public-profile" && selectedMember) {
      return <PublicProfileScreen member={selectedMember} onBack={() => window.history.back()} isDemo={isDemo} />;
    }
    if (subOverlay === "previous-sermon-detail" && selectedSermon) {
      return <PreviousSermonDetailScreen sermon={selectedSermon} onBack={() => window.history.back()} />;
    }
    if (overlay === "bible") return <BibleScreen onBack={() => navTo("/home")} />;
    if (overlay === "prayer") return <PrayerScreen onBack={() => navTo("/home")} isDemo={isDemo} />;
    if (overlay === "profile") {
      return <ProfileScreen onBack={() => navTo("/home")} user={userData} onSignOut={handleSignOut} onUpdateUser={() => refetchProfile()} />;
    }
    if (overlay === "community") {
      return (
        <CommunityScreen
          onBack={() => navTo("/home")}
          onViewProfile={(member) => { setSelectedMember(member); setSubOverlay("public-profile"); window.history.pushState({ subOverlay: "public-profile" }, ""); }}
          userChurchCode={userData.churchCode}
          userChurchName={userData.churchName}
          userChurchId={profile?.church_id || undefined}
          isDemo={isDemo}
        />
      );
    }
    if (overlay === "previous-sermons-list") {
      return (
        <PreviousSermonsListScreen
          sermons={prevSermons}
          onBack={() => navTo("/sermon")}
          onSelectSermon={(s) => { setSelectedSermon(s); setSubOverlay("previous-sermon-detail"); window.history.pushState({ subOverlay: "previous-sermon-detail" }, ""); }}
        />
      );
    }

    switch (activeTab) {
      case "home": {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const reflectedToday = journalEntries.some((e) => (e.type === "reflection" || e.type === "sermon") && e.date === today);
        return (
          <HomeTab
            sermon={sermon}
            isLoading={!isDemo && sermonLoading}
            featureFlags={featureFlags}
            onAddJournalEntry={addJournalEntry}
            reflectedToday={reflectedToday}
            userName={userData.firstName}
            churchName={userData.churchName}
            hasChurch={!!userData.churchCode}
            onNavigate={(screen) => navTo(`/${screen}`)}
            churchId={profile?.church_id || undefined}
            userId={authUser?.id}
            isDemo={isDemo}
          />
        );
      }
      case "sermon":
        return (
          <SermonTab
            sermon={sermon}
            isLoading={!isDemo && sermonLoading}
            previousSermonsCount={prevSermons.length}
            onPreviousSermons={() => navTo("/previous-sermons")}
            hasChurch={!!userData?.churchCode}
          />
        );
      case "journal":
        return (
          <JournalTab
            entries={journalEntries}
            onAddEntry={(entry) => addJournalEntry({ content: entry.fullText, title: entry.sermonTitle, entryType: entry.type })}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            isDemo={isDemo}
          />
        );
      default:
        return (
          <HomeTab
            sermon={sermon}
            isLoading={!isDemo && sermonLoading}
            featureFlags={featureFlags}
            onAddJournalEntry={addJournalEntry}
            reflectedToday={false}
            userName={userData.firstName}
            churchName={userData.churchName}
            hasChurch={!!userData.churchCode}
            onNavigate={(screen) => navTo(`/${screen}`)}
            churchId={profile?.church_id || undefined}
            userId={authUser?.id}
            isDemo={isDemo}
          />
        );
    }
  };

  return (
    <div className={`app-container relative mx-auto ${!isMobile ? "tablet-layout" : ""}`} style={{ background: "hsl(var(--background))" }}>
      {!isMobile && (
        <TabletSidebar
          featureFlags={featureFlags}
          activeItem={activeSidebarItem}
          onNavigate={handleSidebarNavigate}
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      )}

      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            backdropFilter: `blur(${12 * topBarRatio}px)`,
            WebkitBackdropFilter: `blur(${12 * topBarRatio}px)`,
            background: `hsl(var(--card) / ${0.95 * topBarRatio})`,
            transition: "background 0.1s, backdrop-filter 0.1s, -webkit-backdrop-filter 0.1s",
          }}
        />
      )}

      <main
        key={`${activeTab}-${overlay}-${subOverlay}`}
        ref={mainRef}
        onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}
        className={`relative z-10 scrollable-content ${isMobile ? "pb-[84px]" : "pb-8"} pt-[0px] ${!isMobile ? "tablet-content" : ""}`}
        style={{
          minHeight: "100dvh",
          background: (overlay === null && activeTab === "home") ? getSkyGradient() : "hsl(var(--background))",
          ...((!isMobile) ? { marginLeft: sidebarCollapsed ? 64 : 180 } : {}),
        }}
      >
        <div className={!isMobile ? "tablet-content-inner" : ""}>
          {renderMain()}
        </div>
      </main>

      {isMobile && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}

      {isMobile && moreOpen && (
        <MoreSheet
          featureFlags={featureFlags}
          onClose={() => setMoreOpen(false)}
          givingUrl={GIVING_URL}
          onProfile={() => { navTo("/profile"); setMoreOpen(false); }}
          onCommunity={() => { navTo("/community"); setMoreOpen(false); }}
          onBible={() => { navTo("/bible"); setMoreOpen(false); }}
          onPrayer={() => { navTo("/prayer"); setMoreOpen(false); }}
        />
      )}
    </div>
  );
}
