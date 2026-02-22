import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartPulse, CheckCircle2, AlertCircle, Clock, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface PlatformHealthCardProps {
  jobsByStatus: { queued: number; processing: number; completed: number; failed: number; retrying: number };
  recentFailures: { id: string; error_message: string | null; failed_at: string | null; sermon_id: string }[];
  successRate: number;
  totalJobs: number;
  totalSermons: number;
}

export default function PlatformHealthCard({ jobsByStatus, recentFailures, successRate, totalJobs, totalSermons }: PlatformHealthCardProps) {
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

        {/* Recent failures */}
        {recentFailures.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Recent Failures</p>
            <div className="space-y-1.5">
              {recentFailures.map(f => (
                <div key={f.id} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-300 truncate">{f.error_message || "Unknown error"}</p>
                  {f.failed_at && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{format(new Date(f.failed_at), "MMM d, h:mm a")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage estimate */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400">Est. Storage</p>
          <p className="text-sm font-semibold text-slate-200">{(totalSermons * 15).toLocaleString()} MB</p>
          <p className="text-[10px] text-slate-500">~15 MB avg per sermon</p>
        </div>
      </CardContent>
    </Card>
  );
}
