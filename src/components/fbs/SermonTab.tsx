import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Share,
  Church,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import type { SermonUIData } from "@/hooks/useCurrentSermon";
import { useSermonLikes } from "@/hooks/useSermonLikes";
import SermonVideoPlayer, { type SermonVideoPlayerHandle } from "./SermonVideoPlayer";
import ScripturePills from "./ScripturePills";

interface SermonTabProps {
  sermon: SermonUIData | null;
  isLoading?: boolean;
  previousSermonsCount: number;
  onPreviousSermons: () => void;
  hasChurch?: boolean;
  onOpenBible?: (reference: string) => void;
}

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="border-t border-border">
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

export default function SermonTab({ sermon, isLoading, previousSermonsCount, onPreviousSermons, hasChurch = true, onOpenBible }: SermonTabProps) {
  const videoRef = useRef<SermonVideoPlayerHandle>(null);
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
      url: "https://faithbeyondsundays.app",
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

  const handleTimestampClick = (timestamp: string) => {
    const seconds = parseTimestampToSeconds(timestamp);
    videoRef.current?.seekTo(seconds);
  };

  // Churchless state
  if (!hasChurch) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <div>
          <h1 className="text-[34px] font-bold text-foreground leading-tight">Sermon</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">This week's message</p>
        </div>
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
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
          <h1 className="text-[34px] font-bold text-foreground leading-tight">Sermon</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">This week's message</p>
        </div>
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted">
            <Church size={24} className="text-muted-foreground" />
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
        <h1 className="text-[34px] font-bold text-foreground leading-tight">Sermon</h1>
        <p className="text-sm text-muted-foreground font-medium mt-0.5">
          This week's message
        </p>
      </div>

      {/* Video Player */}
      <SermonVideoPlayer
        ref={videoRef}
        videoUrl={sermon.videoUrl}
        sourceUrl={sermon.sourceUrl}
        sourceType={sermon.sourceType}
        thumbnailUrl={sermon.thumbnailUrl}
        storagePath={sermon.storagePath}
        duration={sermon.duration}
      />

      {/* Main Sermon Card */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
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
                  <button
                    onClick={() => handleTimestampClick(ch.timestamp)}
                    className="text-xs font-mono text-primary tap-active hover:underline"
                  >
                    {ch.timestamp}
                  </button>
                )}
              </div>
            ))}
          </AccordionSection>
        )}

        {/* Scripture */}
        {sermon.scriptures.length > 0 && (
          <AccordionSection title="Scripture">
            <ScripturePills scriptures={sermon.scriptures} onOpenBible={onOpenBible} />
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
                  className="rounded-2xl p-4 bg-muted/60"
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
        className="w-full bg-card rounded-2xl p-5 shadow-card flex items-center justify-between tap-active text-left"
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
