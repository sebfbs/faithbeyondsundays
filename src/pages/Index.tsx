import { useState, useRef } from "react";
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
import { JOURNAL_ENTRIES, GIVING_URL } from "@/components/fbs/data";
import type { SermonData } from "@/components/fbs/data";
import type { CommunityMember } from "@/components/fbs/communityData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoMode } from "@/components/fbs/DemoModeProvider";
import { useAuth } from "@/components/fbs/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
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

export type JournalEntry = {
  id: string;
  date: string;
  type: "sermon" | "challenge";
  tag: string;
  preview: string;
  sermonTitle: string;
  bookmarked: boolean;
  fullText: string;
  suggestedScripture?: {
    reference: string;
    text: string;
  };
};

export default function Index() {
  const { isDemo } = useDemoMode();
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const isMobile = useIsMobile();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("fbs_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fbs_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [overlay, setOverlayRaw] = useState<OverlayScreen>(null);
  const setOverlay = (screen: OverlayScreen) => {
    setOverlayRaw(screen);
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  };
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(JOURNAL_ENTRIES);
  const [selectedSermon, setSelectedSermon] = useState<SermonData | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  // Build a UserData-compatible object for existing components
  const userData: UserData | null = isDemo
    ? {
        firstName: "Grace",
        lastName: "Demo",
        username: "grace_demo",
        churchCode: "cornerstone",
        churchName: "Cornerstone Community Church",
        phone: "",
        email: "",
      }
    : profile
    ? {
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username,
        churchCode: profile.church_code || "",
        churchName: profile.church_name || "",
        phone: "",
        email: authUser?.email || "",
        avatarUrl: profile.avatar_url || undefined,
        instagramHandle: profile.instagram_handle || undefined,
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

  // Not authenticated → show auth screen
  if (!isDemo && !authUser) {
    return <AuthScreen />;
  }

  // Authenticated but no profile → onboarding
  if (!isDemo && !profileLoading && !profile) {
    return <OnboardingScreen />;
  }

  // Still loading profile
  if (!isDemo && profileLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <Loader2 size={32} className="animate-spin text-amber" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setActiveTab("home");
    setOverlay(null);
    setMoreOpen(false);
  };

  const addJournalEntry = (entry: JournalEntry) => {
    setJournalEntries((prev) => [entry, ...prev]);
  };

  const updateJournalEntry = (updated: JournalEntry) => {
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === "more") {
      setMoreOpen(true);
      return;
    }
    scrollToTop();
    setMoreOpen(false);
    setOverlay(null);
    setActiveTab(tab);
  };

  const handleSidebarNavigate = (target: SidebarNavTarget) => {
    scrollToTop();
    setMoreOpen(false);
    if (target === "home" || target === "sermon" || target === "journal") {
      setOverlay(null);
      setActiveTab(target as TabId);
    } else if (target === "community") {
      setActiveTab("more");
      setOverlay("community");
    } else if (target === "bible") {
      setActiveTab("more");
      setOverlay("bible");
    } else if (target === "prayer") {
      setActiveTab("more");
      setOverlay("prayer");
    } else if (target === "profile") {
      setActiveTab("more");
      setOverlay("profile");
    }
  };

  const activeSidebarItem: string = overlay || activeTab;

  const renderMain = () => {
    if (!userData) return null;

    if (overlay === "bible") {
      return <BibleScreen onBack={() => setOverlay(null)} />;
    }
    if (overlay === "prayer") {
      return <PrayerScreen onBack={() => setOverlay(null)} />;
    }
    if (overlay === "profile") {
      return (
        <ProfileScreen
          onBack={() => setOverlay(null)}
          user={userData}
          onSignOut={handleSignOut}
          onUpdateUser={(updated) => {
            // For now, profile updates will refetch from DB
          }}
        />
      );
    }
    if (overlay === "community") {
      return (
        <CommunityScreen
          onBack={() => setOverlay(null)}
          onViewProfile={(member) => {
            setSelectedMember(member);
            setOverlay("public-profile");
          }}
          userChurchCode={userData.churchCode || "cornerstone"}
          userChurchName={userData.churchName}
        />
      );
    }
    if (overlay === "public-profile" && selectedMember) {
      return (
        <PublicProfileScreen
          member={selectedMember}
          onBack={() => setOverlay("community")}
        />
      );
    }
    if (overlay === "previous-sermons-list") {
      return (
        <PreviousSermonsListScreen
          onBack={() => setOverlay(null)}
          onSelectSermon={(sermon) => {
            setSelectedSermon(sermon);
            setOverlay("previous-sermon-detail");
          }}
        />
      );
    }
    if (overlay === "previous-sermon-detail" && selectedSermon) {
      return (
        <PreviousSermonDetailScreen
          sermon={selectedSermon}
          onBack={() => setOverlay("previous-sermons-list")}
        />
      );
    }

    switch (activeTab) {
      case "home":
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const reflectedToday = journalEntries.some((e) => e.tag === "Sermon" && e.date === today);
        return <HomeTab onAddJournalEntry={addJournalEntry} reflectedToday={reflectedToday} userName={userData.firstName} churchName={userData.churchName} />;
      case "sermon":
        return <SermonTab onPreviousSermons={() => setOverlay("previous-sermons-list")} />;
      case "journal":
        return <JournalTab entries={journalEntries} onAddEntry={addJournalEntry} onUpdateEntry={updateJournalEntry} onDeleteEntry={deleteJournalEntry} />;
      default:
        return <HomeTab onAddJournalEntry={addJournalEntry} reflectedToday={false} userName={userData.firstName} churchName={userData.churchName} />;
    }
  };

  return (
    <div className={`app-container relative mx-auto ${!isMobile ? "tablet-layout" : ""}`} style={{ background: "hsl(var(--background))" }}>
      {!isMobile && (
        <TabletSidebar
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
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "hsl(var(--background) / 0.8)",
          }}
        />
      )}

      <main
        key={`${activeTab}-${overlay}`}
        ref={mainRef}
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
          onClose={() => setMoreOpen(false)}
          givingUrl={GIVING_URL}
          onProfile={() => { setActiveTab("more"); setOverlay("profile"); setMoreOpen(false); }}
          onCommunity={() => { setActiveTab("more"); setOverlay("community"); setMoreOpen(false); }}
          onBible={() => { setActiveTab("more"); setOverlay("bible"); setMoreOpen(false); }}
          onPrayer={() => { setActiveTab("more"); setOverlay("prayer"); setMoreOpen(false); }}
        />
      )}
    </div>
  );
}
