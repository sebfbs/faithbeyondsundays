import { useState } from "react";
import BottomNav, { TabId } from "@/components/fbs/BottomNav";
import HomeTab from "@/components/fbs/HomeTab";
import SermonTab from "@/components/fbs/SermonTab";
import JournalTab from "@/components/fbs/JournalTab";
import GuidedReflectionScreen from "@/components/fbs/GuidedReflectionScreen";
import ProfileScreen from "@/components/fbs/ProfileScreen";
import MoreSheet from "@/components/fbs/MoreSheet";

type OverlayScreen = "guided-reflection" | "profile" | null;

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayScreen>(null);

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
    // Overlay screens take priority
    if (overlay === "guided-reflection") {
      return (
        <GuidedReflectionScreen onBack={() => setOverlay(null)} />
      );
    }
    if (overlay === "profile") {
      return (
        <ProfileScreen onBack={() => setOverlay(null)} />
      );
    }

    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "sermon":
        return (
          <SermonTab onGuidedReflection={() => setOverlay("guided-reflection")} />
        );
      case "journal":
        return <JournalTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="app-container relative mx-auto" style={{ background: "hsl(var(--background))" }}>

      {/* Scrollable main content */}
      <main
        className="relative z-10 scrollable-content pb-[84px] pt-[0px]"
        style={{ minHeight: "100dvh" }}
      >
        {renderMain()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* More sheet */}
      {moreOpen && (
        <MoreSheet
          onClose={() => setMoreOpen(false)}
          onProfile={() => {
            setOverlay("profile");
            setMoreOpen(false);
          }}
        />
      )}
    </div>
  );
}
