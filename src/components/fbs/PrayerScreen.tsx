import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAccentColors } from "./themeColors";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useCommunityGuidelines } from "@/hooks/useCommunityGuidelines";
import CommunityGuidelinesDialog from "./CommunityGuidelinesDialog";

interface PrayerRequest {
  id: string;
  text: string;
  date: string;
  anonymous: boolean;
}

// localStorage helpers for demo mode only
const STORAGE_KEY = "fbs_prayer_requests";
function loadDemoRequests(): PrayerRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveDemoRequests(requests: PrayerRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

interface PrayerScreenProps {
  onBack: () => void;
  isDemo?: boolean;
}

export default function PrayerScreen({ onBack, isDemo }: PrayerScreenProps) {
  const colors = useAccentColors();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const { user: authUser } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const { accepted: guidelinesAccepted, accept: acceptGuidelines } = useCommunityGuidelines();
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Demo state
  const [demoRequests, setDemoRequests] = useState<PrayerRequest[]>(loadDemoRequests);
  useEffect(() => {
    if (isDemo) saveDemoRequests(demoRequests);
  }, [demoRequests, isDemo]);

  // Real data: fetch user's prayer requests
  const { data: dbRequests = [], isLoading } = useQuery({
    queryKey: ["prayer-requests", authUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("user_id", authUser!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        text: r.content,
        date: new Date(r.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        anonymous: r.visibility === "private",
      }));
    },
    enabled: !isDemo && !!authUser,
  });

  // Real data: submit prayer request
  const submitMutation = useMutation({
    mutationFn: async (params: { content: string; anonymous: boolean }) => {
      const { error } = await supabase.from("prayer_requests").insert({
        user_id: authUser!.id,
        church_id: profile!.church_id!,
        content: params.content,
        visibility: params.anonymous ? "private" : "church",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
      toast({ title: "Prayer request submitted", description: "Your prayer team will be notified." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit prayer request. Try again." });
    },
  });

  const requests = isDemo ? demoRequests : dbRequests;

  const doSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000) {
      toast({ title: "Request is too long", description: "Please keep it under 1000 characters." });
      return;
    }

    if (!guidelinesAccepted && !isDemo) {
      setPendingSubmit(true);
      setShowGuidelines(true);
      return;
    }

    executeSubmit(trimmed);
  };

  const executeSubmit = (trimmed: string) => {

    if (isDemo) {
      const newRequest: PrayerRequest = {
        id: crypto.randomUUID(),
        text: trimmed,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        anonymous,
      };
      setDemoRequests((prev) => [newRequest, ...prev]);
      toast({ title: "Prayer request submitted", description: "Your prayer team will be notified." });
    } else {
      submitMutation.mutate({ content: trimmed, anonymous });
    }

    setText("");
    setAnonymous(false);
  };

  return (
    <div className="min-h-screen px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
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
          className="bg-muted/50 border-none rounded-xl text-sm min-h-[120px] resize-none focus-visible:ring-1 pt-4"
        />
        <div className="flex items-center justify-between mt-4">
          <label className="text-sm text-muted-foreground">Submit anonymously</label>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} />
        </div>
        <button
          onClick={doSubmit}
          disabled={!text.trim() || submitMutation.isPending}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            background: colors.buttonBg,
            color: colors.accentFg,
            boxShadow: text.trim() ? colors.buttonShadow : "none",
          }}
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Prayer Request"}
        </button>
      </div>

      {/* Loading */}
      {!isDemo && isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

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

      <CommunityGuidelinesDialog
        open={showGuidelines}
        context="prayer"
        onAccept={() => {
          acceptGuidelines();
          setShowGuidelines(false);
          if (pendingSubmit) {
            setPendingSubmit(false);
            const trimmed = text.trim();
            if (trimmed) executeSubmit(trimmed);
          }
        }}
      />
    </div>
  );
}
