import { useState } from "react";
import { Flag, Ban, X, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "@/hooks/use-toast";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

interface ReportBlockSheetProps {
  open: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  contentType: "prayer_request" | "group_message" | "profile";
  contentId?: string;
  churchId?: string;
  onBlock?: () => void;
  isDemo?: boolean;
}

export default function ReportBlockSheet({
  open,
  onClose,
  reportedUserId,
  reportedUserName,
  contentType,
  contentId,
  churchId,
  onBlock,
  isDemo,
}: ReportBlockSheetProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"menu" | "report">("menu");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleReport = async () => {
    if (!reason) return;
    if (isDemo) {
      toast({ title: "Report submitted", description: "Thank you for helping keep our community safe." });
      onClose();
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("content_reports" as any).insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      content_type: contentType,
      content_id: contentId || null,
      reason,
      details: details.trim() || null,
      church_id: churchId || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: "Could not submit report. Try again." });
      return;
    }
    toast({ title: "Report submitted", description: "Thank you for helping keep our community safe." });
    onClose();
  };

  const handleBlock = async () => {
    if (isDemo) {
      toast({ title: `${reportedUserName} blocked`, description: "You won't see their content anymore." });
      onBlock?.();
      onClose();
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("blocked_users" as any).insert({
      blocker_id: user.id,
      blocked_id: reportedUserId,
    });
    setSubmitting(false);
    if (error && !(error as any).message?.includes("duplicate")) {
      toast({ title: "Error", description: "Could not block user. Try again." });
      return;
    }
    toast({ title: `${reportedUserName} blocked`, description: "You won't see their content anymore." });
    onBlock?.();
    onClose();
  };

  const reset = () => {
    setMode("menu");
    setReason("");
    setDetails("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center animate-fade-in" onClick={() => { reset(); onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl p-5 space-y-4 animate-slide-up"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">
            {mode === "menu" ? "Options" : "Report Content"}
          </h3>
          <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center tap-active">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {mode === "menu" ? (
          <div className="space-y-2">
            <button
              onClick={() => setMode("report")}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-muted/50 tap-active hover:bg-muted transition-colors text-left"
            >
              <Flag size={18} className="text-accent shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Report</p>
                <p className="text-xs text-muted-foreground">Report to church leadership</p>
              </div>
            </button>
            <button
              onClick={handleBlock}
              disabled={submitting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-muted/50 tap-active hover:bg-muted transition-colors text-left"
            >
              {submitting ? (
                <Loader2 size={18} className="text-destructive shrink-0 animate-spin" />
              ) : (
                <Ban size={18} className="text-destructive shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-destructive">Block {reportedUserName}</p>
                <p className="text-xs text-muted-foreground">You won't see their content</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Why are you reporting this?
            </p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors tap-active ${
                    reason === r.value
                      ? "bg-destructive/10 text-destructive font-semibold border border-destructive/20"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {reason === "other" && (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe the issue..."
                maxLength={500}
                className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setMode("menu")}
                className="flex-1 text-sm font-medium text-muted-foreground bg-muted rounded-xl py-3 tap-active"
              >
                Back
              </button>
              <button
                onClick={handleReport}
                disabled={!reason || submitting}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-destructive rounded-xl py-3 tap-active disabled:opacity-40"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
