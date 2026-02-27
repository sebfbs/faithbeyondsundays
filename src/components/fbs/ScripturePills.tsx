import { BookOpen } from "lucide-react";

interface ScripturePillsProps {
  scriptures: { reference: string; text: string }[];
  onOpenBible?: (reference: string) => void;
}

export function parseScriptureReference(reference: string): { book: string; chapter: number; verse: number } | null {
  // Parse references like "Luke 5:1-7", "1 John 3:16", "Psalm 23:1"
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return { book: match[1], chapter: parseInt(match[2]), verse: parseInt(match[3]) };
}

export default function ScripturePills({ scriptures, onOpenBible }: ScripturePillsProps) {
  if (!scriptures.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {scriptures.map((s, i) => (
        <button
          key={i}
          onClick={() => onOpenBible?.(s.reference)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tap-active transition-colors"
          style={{ background: "hsl(48 80% 94%)", color: "hsl(30 60% 35%)" }}
        >
          <BookOpen size={12} />
          {s.reference}
        </button>
      ))}
    </div>
  );
}
