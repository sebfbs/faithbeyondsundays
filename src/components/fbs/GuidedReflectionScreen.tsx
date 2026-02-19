import { useState } from "react";
import { ArrowLeft, BookOpen, Sparkles, Save } from "lucide-react";
import { SERMON } from "./data";

interface GuidedReflectionScreenProps {
  onBack: () => void;
}

export default function GuidedReflectionScreen({ onBack }: GuidedReflectionScreenProps) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedText, setSavedText] = useState("");

  const handleSave = () => {
    if (text.trim()) {
      setSavedText(text);
      setSaved(true);
    }
  };

  return (
    <div className="px-5 pt-5 pb-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            Guided Reflection
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
            {SERMON.title}
          </p>
        </div>
      </div>

      {/* Journal Prompts Card */}
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-amber-bg flex items-center justify-center">
            <BookOpen size={17} className="text-amber" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Journal Prompts</p>
            <p className="text-xs text-muted-foreground">
              Reflect on the sermon with these questions
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {SERMON.reflectionQuestions.map((q, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 rounded-2xl"
              style={{ background: "hsl(40 25% 97%)" }}
            >
              <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your Reflection Input */}
      {!saved && (
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <p className="text-sm font-bold text-foreground mb-3">Your Reflection</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your thoughts, responses, and reflections here..."
            className="w-full h-36 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground leading-relaxed"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber disabled:opacity-40 disabled:shadow-none transition-opacity"
          >
            <Save size={15} />
            Save Reflection
          </button>
        </div>
      )}

      {/* Saved State */}
      {saved && (
        <>
          <div className="bg-card rounded-3xl p-5 shadow-card">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Your Reflection
            </p>
            <p className="text-sm text-foreground leading-relaxed">{savedText}</p>
            <button
              onClick={() => { setSaved(false); setText(savedText); }}
              className="mt-4 text-xs text-amber font-semibold"
            >
              Edit
            </button>
          </div>

          <div
            className="rounded-3xl p-5"
            style={{ background: "hsl(210 55% 94%)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-sky-soft" style={{ color: "hsl(207 65% 50%)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(207 65% 40%)" }}>
                Suggested Scripture
              </p>
            </div>
            <p className="text-xs font-bold mb-1.5" style={{ color: "hsl(207 65% 40%)" }}>
              Matthew 14:29
            </p>
            <p className="text-sm leading-relaxed italic" style={{ color: "hsl(207 50% 30%)" }}>
              "Come," he said. Then Peter got down out of the boat, walked on the water and came toward Jesus.
            </p>
          </div>
        </>
      )}

      <div className="h-2" />
    </div>
  );
}
