import { useState } from "react";
import { ChevronLeft, ChevronDown, Clock, Calendar, BookText, Play } from "lucide-react";
import type { SermonData } from "./data";

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
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4 space-y-2 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

interface PreviousSermonDetailScreenProps {
  sermon: SermonData;
  onBack: () => void;
}

export default function PreviousSermonDetailScreen({
  sermon,
  onBack,
}: PreviousSermonDetailScreenProps) {
  return (
    <div className="animate-fade-in min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Back button */}
      <div className="px-5 pt-6 pb-2">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-2xl bg-card shadow-card flex items-center justify-center tap-active"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="px-5 pt-2 pb-6 space-y-5">
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
            <p className="text-white/50 text-xs mt-1 z-10 flex items-center gap-1">
              <Clock size={11} />
              {sermon.duration}
            </p>
          </div>
        </div>

        {/* Main Sermon Card */}
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <h2 className="text-xl font-bold text-foreground leading-tight">{sermon.title}</h2>
          <div className="flex items-center gap-1.5 mt-2 mb-1">
            <Calendar size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{sermon.date}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{sermon.subtitle}</p>
          <p className="text-xs text-muted-foreground font-medium mb-4">{sermon.speaker}</p>

          {/* Chapters */}
          <AccordionSection title="Chapters">
            {sermon.chapters.map((ch, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-foreground">{ch.title}</span>
                <span className="text-xs font-mono text-muted-foreground">{ch.timestamp}</span>
              </div>
            ))}
          </AccordionSection>

          {/* Scripture */}
          <AccordionSection title="Scripture">
            {sermon.scriptures.map((s, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "hsl(48 80% 94%)" }}>
                <p className="text-xs font-bold text-amber mb-1.5">{s.reference}</p>
                <p className="text-sm text-foreground leading-relaxed italic">{s.text}</p>
              </div>
            ))}
          </AccordionSection>

          {/* Takeaways */}
          <AccordionSection title="Takeaways">
            {sermon.takeaways.map((t, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "hsl(210 50% 95%)" }}>
                <p className="text-sm text-foreground leading-relaxed">{t}</p>
              </div>
            ))}
          </AccordionSection>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
