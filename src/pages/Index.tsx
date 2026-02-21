import { useState, useEffect, useRef } from "react";
import BottomNav, { TabId } from "@/components/fbs/BottomNav";
import HomeTab from "@/components/fbs/HomeTab";
import SermonTab from "@/components/fbs/SermonTab";
import JournalTab from "@/components/fbs/JournalTab";
import GuidedReflectionScreen from "@/components/fbs/GuidedReflectionScreen";
import BibleScreen from "@/components/fbs/BibleScreen";
import ProfileScreen from "@/components/fbs/ProfileScreen";
import MoreSheet from "@/components/fbs/MoreSheet";
import PreviousSermonsListScreen from "@/components/fbs/PreviousSermonsListScreen";
import PreviousSermonDetailScreen from "@/components/fbs/PreviousSermonDetailScreen";
import CommunityScreen from "@/components/fbs/CommunityScreen";
import PublicProfileScreen from "@/components/fbs/PublicProfileScreen";
import WelcomeScreen, { UserData } from "@/components/fbs/WelcomeScreen";
import { JOURNAL_ENTRIES } from "@/components/fbs/data";
import type { SermonData } from "@/components/fbs/data";
import type { CommunityMember } from "@/components/fbs/communityData";
import { setFollows, getFollows, DEMO_MEMBERS } from "@/components/fbs/communityData";

type OverlayScreen =
  | "guided-reflection"
  | "profile"
  | "previous-sermons-list"
  | "previous-sermon-detail"
  | "community"
  | "public-profile"
  | "bible"
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

function loadUser(): UserData | null {
  try {
    const raw = localStorage.getItem("fbs_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Index() {
  const [user, setUser] = useState<UserData | null>(loadUser);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [overlay, setOverlayRaw] = useState<OverlayScreen>(null);
  const setOverlay = (screen: OverlayScreen) => {
    setOverlayRaw(screen);
    setTimeout(() => {
      mainRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    }, 0);
  };
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(JOURNAL_ENTRIES);
  const [selectedSermon, setSelectedSermon] = useState<SermonData | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  const handleOnboardingComplete = (data: UserData) => {
    localStorage.setItem("fbs_user", JSON.stringify(data));
    setUser(data);
    // Auto-follow church members on signup
    const churchMembers = DEMO_MEMBERS.filter((m) => m.churchCode === data.churchCode);
    const currentFollows = getFollows();
    const newFollows = [...new Set([...currentFollows, ...churchMembers.map((m) => m.username)])];
    setFollows(newFollows);
  };

  const handleSignOut = () => {
    localStorage.removeItem("fbs_user");
    setUser(null);
    setActiveTab("home");
    setOverlay(null);
    setMoreOpen(false);
  };

  if (!user) {
    return <WelcomeScreen onComplete={handleOnboardingComplete} />;
  }

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

  const renderMain = () => {
    if (overlay === "guided-reflection") {
      return <GuidedReflectionScreen onBack={() => { setOverlay(null); }} />;
    }
    if (overlay === "bible") {
      return <BibleScreen onBack={() => { setOverlay(null); }} />;
    }
    if (overlay === "profile") {
      return <ProfileScreen onBack={() => { setOverlay(null); }} user={user} onSignOut={handleSignOut} />;
    }
    if (overlay === "community") {
      return (
        <CommunityScreen
          onBack={() => setOverlay(null)}
          onViewProfile={(member) => {
            setSelectedMember(member);
            setOverlay("public-profile");
          }}
          userChurchCode={user.churchCode || "cornerstone"}
          userChurchName={user.churchName}
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
        return <HomeTab onGuidedReflection={() => setOverlay("guided-reflection")} userName={user.firstName} churchName={user.churchName} />;
      case "sermon":
        return (
          <SermonTab
            onPreviousSermons={() => setOverlay("previous-sermons-list")}
          />
        );
      case "journal":
        return <JournalTab entries={journalEntries} onAddEntry={addJournalEntry} onUpdateEntry={updateJournalEntry} onDeleteEntry={deleteJournalEntry} />;
      default:
        return <HomeTab onGuidedReflection={() => setOverlay("guided-reflection")} userName={user.firstName} churchName={user.churchName} />;
    }
  };

  return (
    <div className="app-container relative mx-auto" style={{ background: "hsl(var(--background))" }}>
      {/* Frosted status bar backdrop for iPhone notch/Dynamic Island */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "hsl(var(--background) / 0.8)",
        }}
      />
      <main
        ref={mainRef}
        className="relative z-10 scrollable-content pb-[84px] pt-[0px]"
        style={{ minHeight: "100dvh" }}
      >
        {renderMain()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {moreOpen && (
        <MoreSheet
          onClose={() => setMoreOpen(false)}
          onProfile={() => {
            setActiveTab("more");
            setOverlay("profile");
            setMoreOpen(false);
          }}
          onCommunity={() => {
            setActiveTab("more");
            setOverlay("community");
            setMoreOpen(false);
          }}
          onBible={() => {
            setActiveTab("more");
            setOverlay("bible");
            setMoreOpen(false);
          }}
        />
      )}
    </div>
  );
}
