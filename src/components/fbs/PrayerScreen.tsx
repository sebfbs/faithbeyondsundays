import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getAccentColors } from "./themeColors";

interface PrayerRequest {
  id: string;
  text: string;
  date: string;
  anonymous: boolean;
}

const STORAGE_KEY = "fbs_prayer_requests";

function loadRequests(): PrayerRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequests(requests: PrayerRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

interface PrayerScreenProps {
  onBack: () => void;
}

export default function PrayerScreen({ onBack }: PrayerScreenProps) {
  const colors = getAccentColors();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [requests, setRequests] = useState<PrayerRequest[]>(loadRequests);

  useEffect(() => {
    saveRequests(requests);
  }, [requests]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      toast({ title: "Request is too long", description: "Please keep it under 1000 characters." });
      return;
    }
    const newRequest: PrayerRequest = {
      id: crypto.randomUUID(),
      text: trimmed,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      anonymous,
    };
    setRequests((prev) => [newRequest, ...prev]);
    setText("");
    setAnonymous(false);
    toast({ title: "Prayer request submitted", description: "Your prayer team will be notified." });
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center tap-active">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Prayer Requests</h1>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 p-5 mb-6">
        <Textarea
          placeholder="What would you like prayer for?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          className="bg-muted/50 border-none rounded-xl text-sm min-h-[120px] resize-none focus-visible:ring-1"
        />
        <div className="flex items-center justify-between mt-4">
          <label className="text-sm text-muted-foreground">Submit anonymously</label>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            background: colors.buttonBg,
            color: colors.accentFg,
            boxShadow: text.trim() ? colors.buttonShadow : "none",
          }}
        >
          Submit Prayer Request
        </button>
      </div>

      {/* Past Requests */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Your Requests</h2>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{req.date}</span>
                  {req.anonymous && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Anonymous</span>
                  )}
                </div>
                <p className="text-sm text-foreground line-clamp-3">{req.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
