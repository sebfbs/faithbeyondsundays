import { useState, useEffect } from "react";
import BottomNav, { TabId } from "@/components/fbs/BottomNav";
import HomeTab from "@/components/fbs/HomeTab";
import SermonTab from "@/components/fbs/SermonTab";
import JournalTab from "@/components/fbs/JournalTab";
import GuidedReflectionScreen from "@/components/fbs/GuidedReflectionScreen";
import ProfileScreen from "@/components/fbs/ProfileScreen";
import MoreSheet from "@/components/fbs/MoreSheet";
import PreviousSermonsListScreen from "@/components/fbs/PreviousSermonsListScreen";
import PreviousSermonDetailScreen from "@/components/fbs/PreviousSermonDetailScreen";
import WelcomeScreen, { UserData } from "@/components/fbs/WelcomeScreen";
import { JOURNAL_ENTRIES } from "@/components/fbs/data";
import type { SermonData } from "@/components/fbs/data";

type OverlayScreen =
  | "guided-reflection"
  | "profile"
  | "previous-sermons-list"
  | "previous-sermon-detail"
  | null;

export type JournalEntry = typeof JOURNAL_ENTRIES[number];

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
  const [overlay, setOverlay] = useState<OverlayScreen>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(JOURNAL_ENTRIES);
  const [selectedSermon, setSelectedSermon] = useState<SermonData | null>(null);

  const handleOnboardingComplete = (data: UserData) => {
    localStorage.setItem("fbs_user", JSON.stringify(data));
    setUser(data);
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

  const handleTabChange = (tab: TabId) => {
    if (tab === "more") {
      setMoreOpen(true);
      return;
    }
    setMoreOpen(false);
    setOverlay(null);
    setActiveTab(tab);
  };

  const renderMain = () => {
    if (overlay === "guided-reflection") {
      return <GuidedReflectionScreen onBack={() => setOverlay(null)} />;
    }
    if (overlay === "profile") {
      return <ProfileScreen onBack={() => setOverlay(null)} user={user} onSignOut={handleSignOut} />;
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
        return <HomeTab onChallengeReflection={addJournalEntry} userName={user.firstName} churchName={user.churchName} />;
      case "sermon":
        return (
          <SermonTab
            onGuidedReflection={() => setOverlay("guided-reflection")}
            onPreviousSermons={() => setOverlay("previous-sermons-list")}
          />
        );
      case "journal":
        return <JournalTab entries={journalEntries} />;
      default:
        return <HomeTab onChallengeReflection={addJournalEntry} userName={user.firstName} churchName={user.churchName} />;
    }
  };

  return (
    <div className="app-container relative mx-auto" style={{ background: "hsl(var(--background))" }}>
      <main
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
        />
      )}
    </div>
  );
}
