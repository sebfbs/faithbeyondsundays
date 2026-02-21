import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Play,
} from "lucide-react";
import { SERMON, PREVIOUS_SERMONS_COUNT } from "./data";

interface SermonTabProps {
  onPreviousSermons: () => void;
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
          className={`text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 space-y-2 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

export default function SermonTab({ onPreviousSermons }: SermonTabProps) {
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
          {/* Subtle cross */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div
              style={{
                width: 60,
                height: 4,
                background: "white",
                position: "absolute",
              }}
            />
            <div
              style={{
                width: 4,
                height: 80,
                background: "white",
                position: "absolute",
              }}
            />
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 z-10">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
          <p className="text-white/80 text-xs font-medium z-10">Tap to watch</p>
          <p className="text-white/50 text-xs mt-1 z-10 flex items-center gap-1">
            <Clock size={11} />
            {SERMON.duration}
          </p>
        </div>
      </div>

      {/* Main Sermon Card */}
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <h2 className="text-xl font-bold text-foreground leading-tight">
          {SERMON.title}
        </h2>
        <div className="flex items-center gap-1.5 mt-2 mb-1">
          <Calendar size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            {SERMON.date}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {SERMON.subtitle}
        </p>
        <p className="text-xs text-muted-foreground font-medium mb-4">
          {SERMON.speaker}
        </p>

        {/* Chapters */}
        <AccordionSection title="Chapters">
          {SERMON.chapters.map((ch, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-foreground">{ch.title}</span>
              <span className="text-xs font-mono text-muted-foreground">
                {ch.timestamp}
              </span>
            </div>
          ))}
        </AccordionSection>

        {/* Scripture */}
        <AccordionSection title="Scripture">
          {SERMON.scriptures.map((s, i) => (
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

        {/* Takeaways */}
        <AccordionSection title="Takeaways">
          {SERMON.takeaways.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "hsl(210 50% 95%)" }}
            >
              <p className="text-sm text-foreground leading-relaxed">{t}</p>
            </div>
          ))}
        </AccordionSection>
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
            {PREVIOUS_SERMONS_COUNT} past messages saved
          </p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>

      <div className="h-2" />
    </div>
  );
}
