import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HeartPulse, CheckCircle2, AlertCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface Failure {
  id: string;
  error_message: string | null;
  failed_at: string | null;
  sermon_id: string;
  church_id: string | null;
}

interface Church {
  id: string;
  name: string;
}

interface PlatformHealthCardProps {
  jobsByStatus: { queued: number; processing: number; completed: number; failed: number; retrying: number };
  recentFailures: Failure[];
  allFailures: Failure[];
  successRate: number;
  totalJobs: number;
  storageBytes: number;
  churches: Church[];
}

export default function PlatformHealthCard({ jobsByStatus, recentFailures, allFailures, successRate, totalJobs, storageBytes, churches }: PlatformHealthCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const churchName = (id: string | null) =>
    churches.find(c => c.id === id)?.name ?? "Unknown Church";

  const healthColor = successRate >= 95 ? "text-emerald-400" : successRate >= 80 ? "text-amber-400" : "text-red-400";
  const healthBg = successRate >= 95 ? "bg-emerald-500/10" : successRate >= 80 ? "bg-amber-500/10" : "bg-red-500/10";
  const healthLabel = successRate >= 95 ? "Healthy" : successRate >= 80 ? "Degraded" : "Unhealthy";

  const statusItems = [
    { label: "Queued", count: jobsByStatus.queued, icon: Clock, color: "text-slate-400" },
    { label: "Processing", count: jobsByStatus.processing, icon: Loader2, color: "text-blue-400" },
    { label: "Completed", count: jobsByStatus.completed, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Retrying", count: jobsByStatus.retrying, icon: RotateCcw, color: "text-amber-400" },
    { label: "Failed", count: jobsByStatus.failed, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-violet-400" /> Platform Health
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${healthBg} ${healthColor}`}>
            {healthLabel}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pipeline status */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Sermon Pipeline</p>
            <div className="grid grid-cols-5 gap-2">
              {statusItems.map(s => (
                <div key={s.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <s.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${s.color} ${s.label === "Processing" && s.count > 0 ? "animate-spin" : ""}`} />
                  <p className="text-lg font-bold text-slate-100">{s.count}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Success rate bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Success Rate</span>
              <span className={healthColor}>{successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${successRate >= 95 ? "bg-emerald-500" : successRate >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(successRate, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{totalJobs} total jobs processed</p>
          </div>

          {/* Failures inline preview + button */}
          {recentFailures.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Recent Failures</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setDialogOpen(true)}
                >
                  View all {allFailures.length}
                </Button>
              </div>
              <div className="space-y-1.5">
                {recentFailures.map(f => (
                  <div key={f.id} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-red-300">{churchName(f.church_id)}</p>
                    <p className="text-xs text-red-300/70 truncate">{f.error_message || "Unknown error"}</p>
                    {f.failed_at && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{format(new Date(f.failed_at), "MMM d, h:mm a")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No failures */}
          {recentFailures.length === 0 && totalJobs > 0 && (
            <p className="text-xs text-emerald-400">No pipeline failures. 🎉</p>
          )}

          {/* Storage */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Storage Used</p>
            <p className="text-sm font-semibold text-slate-200">{(storageBytes / (1024 * 1024)).toFixed(1)} MB</p>
            <p className="text-[10px] text-slate-500">actual Supabase storage</p>
          </div>
        </CardContent>
      </Card>

      {/* All failures dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              Sermon Pipeline Failures ({allFailures.length})
            </DialogTitle>
          </DialogHeader>
          {allFailures.length === 0 ? (
            <p className="text-sm text-slate-400">No failures on record.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {allFailures.map(f => (
                <div key={f.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-red-300">{churchName(f.church_id)}</p>
                    {f.failed_at && (
                      <p className="text-[10px] text-slate-500 shrink-0">{format(new Date(f.failed_at), "MMM d, yyyy h:mm a")}</p>
                    )}
                  </div>
                  <p className="text-xs text-red-300/80">{f.error_message || "Unknown error"}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Sermon ID: {f.sermon_id}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
