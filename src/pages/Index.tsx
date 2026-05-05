import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BottomNav, { TabId } from "@/components/fbs/BottomNav";
import HomeTab, { getSkyGradient, getSkyGradientTopColor } from "@/components/fbs/HomeTab";
import SermonTab from "@/components/fbs/SermonTab";
import JournalTab from "@/components/fbs/JournalTab";
import BibleScreen from "@/components/fbs/BibleScreen";
import ProfileScreen from "@/components/fbs/ProfileScreen";
import MoreSheet from "@/components/fbs/MoreSheet";
import PreviousSermonsListScreen from "@/components/fbs/PreviousSermonsListScreen";
import GroupsListScreen from "@/components/fbs/GroupsListScreen";
import PreviousSermonDetailScreen from "@/components/fbs/PreviousSermonDetailScreen";
import CommunityScreen from "@/components/fbs/CommunityScreen";
import PrayerScreen from "@/components/fbs/PrayerScreen";
import PublicProfileScreen from "@/components/fbs/PublicProfileScreen";
import AuthScreen from "@/components/fbs/AuthScreen";
import OnboardingScreen from "@/components/fbs/OnboardingScreen";
import TabletSidebar, { SidebarNavTarget } from "@/components/fbs/TabletSidebar";
import DailySparkOverlay from "@/components/fbs/DailySparkOverlay";
import { GIVING_URL } from "@/components/fbs/data";
import type { SermonUIData } from "@/hooks/useCurrentSermon";
import { parseScriptureReference } from "@/components/fbs/ScripturePills";
import type { CommunityMember } from "@/components/fbs/communityData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoMode } from "@/components/fbs/DemoModeProvider";
import { useAuth } from "@/components/fbs/AuthProvider";
import { useTheme } from "next-themes";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentSermon } from "@/hooks/useCurrentSermon";
import { usePreviousSermons } from "@/hooks/usePreviousSermons";
import { useJournalEntries, type JournalEntry } from "@/hooks/useJournalEntries";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { DEMO_SERMON, DEMO_PREVIOUS_SERMONS, DEMO_JOURNAL_ENTRIES } from "@/components/fbs/demoData";
import type { UserData } from "@/components/fbs/WelcomeScreen";
import { Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import AchievementBanner from "@/components/fbs/AchievementBanner";
import { getBadgeTier, getUserBadgeConfig } from "@/components/fbs/badgeConfig";
import type { BadgeDisplay } from "@/components/fbs/AchievementBanner";

type OverlayScreen =
  | "profile"
  | "previous-sermons-list"
  | "previous-sermon-detail"
  | "community"
  | "community-groups"
  | "public-profile"
  | "bible"
  | "prayer"
  | null;

export type { JournalEntry } from "@/hooks/useJournalEntries";

export default function Index() {
  const { isDemo } = useDemoMode();
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { resolvedTheme } = useTheme();
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

  // Fetch daily content for churchless users (lifted from HomeTab so overlay can access it)
  const hasChurch = !!(isDemo ? "cornerstone" : profile?.church_code);
  const { data: dailyContent } = useQuery<{ spark_message: string; reflection_prompt: string }>({
    queryKey: ["daily-content"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-daily-content");
      if (error) throw error;
      return data;
    },
    enabled: !hasChurch && !isDemo,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

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

  const handleGiveTap = useCallback(() => {
    if (profile?.church_id && authUser && !isDemo) {
      supabase.from("analytics_events").insert({
        church_id: profile.church_id,
        user_id: authUser.id,
        event_type: "give_tap",
      }).then(() => {});
    }
    window.open(GIVING_URL, "_blank");
  }, [profile, authUser, isDemo]);

  // Achievement banner state
  const [pendingBadge, setPendingBadge] = useState<BadgeDisplay | null>(null);

  // Realtime: listen for new badges earned by the current user
  useEffect(() => {
    if (!authUser || isDemo) return;
    const channel = supabase
      .channel(`badges-${authUser.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reflection_badges",
        filter: `user_id=eq.${authUser.id}`,
      }, (payload: any) => {
        const tier = getBadgeTier(payload.new.milestone);
        if (tier) {
          setPendingBadge(tier);
          confetti({ particleCount: 160, spread: 80, origin: { x: 0.5, y: 0.1 } });
        }
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "user_badges",
        filter: `user_id=eq.${authUser.id}`,
      }, (payload: any) => {
        const config = getUserBadgeConfig(payload.new.badge_type);
        if (config) {
          setPendingBadge(config);
          confetti({ particleCount: 160, spread: 80, origin: { x: 0.5, y: 0.1 } });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authUser?.id, isDemo]);

  const handleJoined = useCallback(async () => {
    await refetchProfile();
    confetti({ particleCount: 160, spread: 80, origin: { x: 0.5, y: 0.1 } });
  }, [refetchProfile]);


  // Derive active screen from URL path
  const pathScreen = location.pathname.replace(/^\//, "") || "home";
  const tabScreens = ["home", "sermon", "journal"];
  const overlayScreens = ["community", "community-groups", "bible", "prayer", "profile", "previous-sermons"];

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
  const [journalComposing, setJournalComposing] = useState(false);
  const [bibleView, setBibleView] = useState<"books" | "chapters" | "text">("books");
  const [selectedSermon, setSelectedSermon] = useState<SermonUIData | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [subOverlay, setSubOverlay] = useState<"previous-sermon-detail" | "public-profile" | null>(null);
  const [bibleDeepLink, setBibleDeepLink] = useState<{ book: string; chapter: number; verse?: number } | null>(null);
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

  const handleOpenBible = useCallback((reference: string) => {
    const parsed = parseScriptureReference(reference);
    if (parsed) {
      setBibleDeepLink({ book: parsed.book, chapter: parsed.chapter, verse: parsed.verse });
    } else {
      setBibleDeepLink(null);
    }
    navTo("/bible");
  }, [navTo]);

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

  // Preview bypass — skip auth entirely for local development previews
  if (new URLSearchParams(window.location.search).get("preview") === "onboarding") return <OnboardingScreen />;

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
      return <PublicProfileScreen member={selectedMember} onBack={() => window.history.back()} isDemo={isDemo} churchId={profile?.church_id || undefined} />;
    }
    if (subOverlay === "previous-sermon-detail" && selectedSermon) {
      return <PreviousSermonDetailScreen sermon={selectedSermon} onBack={() => window.history.back()} onOpenBible={handleOpenBible} />;
    }
    if (overlay === "bible") return <BibleScreen onBack={() => { setBibleDeepLink(null); setBibleView("books"); navTo("/home"); }} initialBook={bibleDeepLink?.book} initialChapter={bibleDeepLink?.chapter} initialVerse={bibleDeepLink?.verse} onViewChange={setBibleView} />;
    if (overlay === "prayer") return <PrayerScreen onBack={() => navTo("/home")} isDemo={isDemo} />;
    if (overlay === "profile") {
      return <ProfileScreen onBack={() => navTo("/home")} user={userData} onSignOut={handleSignOut} onUpdateUser={() => refetchProfile()} />;
    }
    if (overlay === "community") {
      return (
        <CommunityScreen
          onBack={() => navTo("/home")}
          onViewProfile={(member) => { setSelectedMember(member); setSubOverlay("public-profile"); window.history.pushState({ subOverlay: "public-profile" }, ""); }}
          onGroups={() => navTo("/community-groups")}
          userChurchCode={userData.churchCode}
          userChurchName={userData.churchName}
          userChurchId={profile?.church_id || undefined}
          isDemo={isDemo}
          onJoined={handleJoined}
        />
      );
    }
    if (overlay === "community-groups") {
      return (
        <GroupsListScreen
          onBack={() => navTo("/community")}
          userChurchCode={userData.churchCode}
          userChurchId={profile?.church_id || undefined}
          isDemo={isDemo}
          onViewProfile={async (userId) => {
            const { data: p } = await supabase
              .from("profiles_safe")
              .select("user_id, username, first_name, last_name, avatar_url, bio, instagram_handle, church_id, challenges_completed, created_at")
              .eq("user_id", userId)
              .single();
            if (!p) return;
            let churchName = "";
            let churchCode = "";
            if (p.church_id) {
              const { data: church } = await supabase
                .from("churches")
                .select("name, code")
                .eq("id", p.church_id)
                .single();
              churchName = church?.name || "";
              churchCode = church?.code || "";
            }
            const member = {
              userId: p.user_id,
              username: p.username || "",
              firstName: p.first_name || "",
              lastName: p.last_name || "",
              churchName,
              churchCode,
              avatarUrl: p.avatar_url || undefined,
              memberSince: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              challengesCompleted: p.challenges_completed || 0,
              isGroupMember: false,
              instagramHandle: p.instagram_handle || undefined,
            };
            setSelectedMember(member);
            setSubOverlay("public-profile");
            window.history.pushState({ subOverlay: "public-profile" }, "");
          }}
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
            profileReady={isDemo || !profileLoading}
            onNavigate={(screen) => navTo(`/${screen}`)}
            churchId={profile?.church_id || undefined}
            userId={authUser?.id}
            isDemo={isDemo}
            dailyContent={dailyContent || undefined}
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
            onOpenBible={handleOpenBible}
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
            onComposingChange={setJournalComposing}
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
            profileReady={isDemo || !profileLoading}
            onNavigate={(screen) => navTo(`/${screen}`)}
            churchId={profile?.church_id || undefined}
            userId={authUser?.id}
            isDemo={isDemo}
            dailyContent={dailyContent || undefined}
          />
        );
    }
  };

  // Determine spark message for the overlay
  const sparkMessage = sermon?.spark || dailyContent?.spark_message || "";

  return (
    <div className={`app-container relative mx-auto ${!isMobile ? "tablet-layout" : ""}`} style={{ background: "hsl(var(--background))" }}>
      {pendingBadge && <AchievementBanner badge={pendingBadge} onDismiss={() => setPendingBadge(null)} />}
      {sparkMessage && <DailySparkOverlay sparkMessage={sparkMessage} />}
      {!isMobile && (
        <TabletSidebar
          featureFlags={featureFlags}
          activeItem={activeSidebarItem}
          onNavigate={handleSidebarNavigate}
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onGive={handleGiveTap}
        />
      )}

      {isMobile && (
        <div
          className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            backdropFilter: `blur(${(overlay === null && activeTab === "home") ? 12 * topBarRatio : 12}px)`,
            WebkitBackdropFilter: `blur(${(overlay === null && activeTab === "home") ? 12 * topBarRatio : 12}px)`,
            background: (overlay === null && activeTab === "home" && resolvedTheme !== "dark")
              ? getSkyGradientTopColor().replace(')', ` / ${0.95 * topBarRatio})`)
              : `hsl(var(--background) / 0.95)`,
            transition: "background 0.1s, backdrop-filter 0.1s, -webkit-backdrop-filter 0.1s",
          }}
        />
      )}

      <main
        key={`${activeTab}-${overlay}-${subOverlay}`}
        ref={mainRef}
        onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}
        className={`relative z-10 scrollable-content ${isMobile ? ((overlay === "community-groups" || (overlay === "bible" && bibleView === "text")) ? "pb-0" : "pb-[84px]") : "pb-8"} pt-[0px] ${!isMobile ? "tablet-content" : ""}`}
        style={{
          minHeight: "100dvh",
          background: (overlay === null && activeTab === "home" && resolvedTheme !== "dark") ? getSkyGradient() : "hsl(var(--background))",
          ...((!isMobile) ? { marginLeft: sidebarCollapsed ? 64 : 180 } : {}),
        }}
      >
        <div className={!isMobile ? "tablet-content-inner" : ""}>
          {renderMain()}
        </div>
      </main>

      {isMobile && !journalComposing && overlay !== "community-groups" && !(overlay === "bible" && bibleView === "text") && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} moreOpen={moreOpen} />}

      {isMobile && moreOpen && (
        <MoreSheet
          featureFlags={featureFlags}
          onClose={() => setMoreOpen(false)}
          givingUrl={GIVING_URL}
          onGive={handleGiveTap}
          onProfile={() => { navTo("/profile"); setMoreOpen(false); }}
          onCommunity={() => { navTo("/community"); setMoreOpen(false); }}
          onBible={() => { navTo("/bible"); setMoreOpen(false); }}
          onPrayer={() => { navTo("/prayer"); setMoreOpen(false); }}
        />
      )}
    </div>
  );
}
