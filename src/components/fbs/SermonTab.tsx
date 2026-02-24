import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Play,
  Share,
  Church,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import type { SermonUIData } from "@/hooks/useCurrentSermon";
import { useSermonLikes } from "@/hooks/useSermonLikes";

interface SermonTabProps {
  sermon: SermonUIData | null;
  isLoading?: boolean;
  previousSermonsCount: number;
  onPreviousSermons: () => void;
  hasChurch?: boolean;
}

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left tap-active"
      >
        <span className="text-sm font-semibold text-foreground uppercase tracking-widest">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="min-h-0">
          <div className="pb-4 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function SermonTab({ sermon, isLoading, previousSermonsCount, onPreviousSermons, hasChurch = true }: SermonTabProps) {
  const {
    sermonLikeCount,
    hasLikedSermon,
    getTakeawayLikes,
    toggleSermonLike,
    toggleTakeawayLike,
    isAuthenticated,
  } = useSermonLikes(sermon?.id);

  const handleShare = async () => {
    if (!sermon) return;
    const shareData = {
      title: sermon.title,
      text: `Check out this sermon: "${sermon.title}" by ${sermon.speaker}`,
      url: "https://faithbeyondsundays.lovable.app",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast("Link copied to clipboard!");
      }
    } catch (e) {
      // User cancelled share
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      toast("Sign in to like sermons");
      return;
    }
    toggleSermonLike();
  };

  const handleTakeawayLike = (index: number) => {
    if (!isAuthenticated) {
      toast("Sign in to like takeaways");
      return;
    }
    toggleTakeawayLike(index);
  };

  // Churchless state
  if (!hasChurch) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sermon</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">This week's message</p>
        </div>
        <div className="bg-card rounded-3xl p-8 shadow-card text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
            <Church size={24} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Connect to a Church</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join a church to access weekly sermons, daily sparks, reflections, and more.
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && !sermon) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sermon</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">This week's message</p>
        </div>
        <div className="bg-card rounded-3xl p-8 shadow-card text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
            <Play size={24} className="text-muted-foreground ml-1" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">No sermon yet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Check back after Sunday! Your pastor will upload this week's message.
          </p>
        </div>
      </div>
    );
  }

  if (!sermon) return null;

  return (
    <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sermon</h1>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">
          This week's message
        </p>
      </div>

      {/* Video Thumbnail */}
      <div className="relative rounded-3xl overflow-hidden tap-active">
        <div
          className="w-full aspect-video flex flex-col items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, hsl(207, 55%, 35%) 0%, hsl(220, 50%, 25%) 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div style={{ width: 60, height: 4, background: "white", position: "absolute" }} />
            <div style={{ width: 4, height: 80, background: "white", position: "absolute" }} />
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 z-10">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
          <p className="text-white/80 text-xs font-medium z-10">Tap to watch</p>
          {sermon.duration && (
            <p className="text-white/50 text-xs mt-1 z-10 flex items-center gap-1">
              <Clock size={11} />
              {sermon.duration}
            </p>
          )}
        </div>
      </div>

      {/* Main Sermon Card */}
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground leading-tight flex-1">
            {sermon.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className="tap-active p-1 flex items-center gap-1 transition-transform active:scale-125"
            >
              <Heart
                size={18}
                className={hasLikedSermon ? "text-red-500 fill-red-500" : "text-muted-foreground"}
              />
              {sermonLikeCount > 0 && (
                <span className="text-xs text-muted-foreground font-medium">{sermonLikeCount}</span>
              )}
            </button>
            <button onClick={handleShare} className="tap-active p-1 -mr-1">
              <Share size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <Calendar size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            {sermon.date}
          </span>
        </div>
        {sermon.subtitle && (
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {sermon.subtitle}
          </p>
        )}
        {sermon.speaker && (
          <p className="text-xs text-muted-foreground font-medium mb-4">
            {sermon.speaker}
          </p>
        )}

        {/* Chapters */}
        {sermon.chapters.length > 0 && (
          <AccordionSection title="Chapters">
            {sermon.chapters.map((ch, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-foreground">{ch.title}</span>
                {ch.timestamp && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {ch.timestamp}
                  </span>
                )}
              </div>
            ))}
          </AccordionSection>
        )}

        {/* Scripture */}
        {sermon.scriptures.length > 0 && (
          <AccordionSection title="Scripture">
            {sermon.scriptures.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-4"
                style={{ background: "hsl(48 80% 94%)" }}
              >
                <p className="text-xs font-bold text-amber mb-1.5">{s.reference}</p>
                <p className="text-sm text-foreground leading-relaxed italic">
                  {s.text}
                </p>
              </div>
            ))}
          </AccordionSection>
        )}

        {/* Takeaways */}
        {sermon.takeaways.length > 0 && (
          <AccordionSection title="Takeaways">
            {sermon.takeaways.map((t, i) => {
              const info = getTakeawayLikes(i);
              return (
                <div
                  key={i}
                  className="rounded-2xl p-4"
                  style={{ background: "hsl(210 50% 95%)" }}
                >
                  <p className="text-sm text-foreground leading-relaxed">{t}</p>
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <button
                      onClick={() => handleTakeawayLike(i)}
                      className="tap-active flex items-center gap-1 transition-transform active:scale-125"
                    >
                      <Heart
                        size={14}
                        className={info.hasLiked ? "text-red-500 fill-red-500" : "text-muted-foreground"}
                      />
                      {info.count > 0 && (
                        <span className="text-xs text-muted-foreground">{info.count}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </AccordionSection>
        )}
      </div>

      {/* Previous Sermons */}
      <button
        onClick={onPreviousSermons}
        className="w-full bg-card rounded-3xl p-5 shadow-card flex items-center justify-between tap-active text-left"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Previous Sermons
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {previousSermonsCount} past messages saved
          </p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>

      <div className="h-2" />
    </div>
  );
}
