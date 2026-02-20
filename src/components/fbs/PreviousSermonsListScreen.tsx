import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { PREVIOUS_SERMONS, SERMON } from "./data";
import type { SermonData } from "./data";

interface PreviousSermonsListScreenProps {
  onBack: () => void;
  onSelectSermon: (sermon: SermonData) => void;
}

export default function PreviousSermonsListScreen({
  onBack,
  onSelectSermon,
}: PreviousSermonsListScreenProps) {
  const allPrevious = [SERMON, ...PREVIOUS_SERMONS].slice(1); // exclude current week
  const sermons = PREVIOUS_SERMONS;

  return (
    <div className="animate-fade-in min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-2xl bg-card shadow-card flex items-center justify-center tap-active flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Previous Sermons</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {sermons.length} past messages saved
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-3">
        {sermons.map((sermon, i) => (
          <button
            key={i}
            onClick={() => onSelectSermon(sermon)}
            className="w-full bg-card rounded-3xl p-5 shadow-card flex items-center justify-between tap-active text-left"
          >
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-base font-bold text-foreground leading-tight">{sermon.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{sermon.subtitle}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <Calendar size={11} />
                  {sermon.date}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <Clock size={11} />
                  {sermon.duration}
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
