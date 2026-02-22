import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";

interface EngagementMetricsProps {
  activeUsers7d: number;
  activeUsers30d: number;
  totalMembers: number;
  events: { created_at: string; user_id: string; event_type: string }[];
  inactiveChurches: { id: string; name: string }[];
}

export default function EngagementMetrics({ activeUsers7d, activeUsers30d, totalMembers, events, inactiveChurches }: EngagementMetricsProps) {
  const dauMau = activeUsers30d > 0 ? ((activeUsers7d / 7) / (activeUsers30d / 30)).toFixed(2) : "—";

  // Avg app opens per user per week (last 30d)
  const appOpens30d = events.filter(e => {
    const d = new Date(e.created_at);
    return e.event_type === "app_open" && d >= new Date(Date.now() - 30 * 86400000);
  });
  const uniqueUsers = new Set(appOpens30d.map(e => e.user_id)).size;
  const avgOpensPerWeek = uniqueUsers > 0 ? (appOpens30d.length / uniqueUsers / (30 / 7)).toFixed(1) : "—";

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" /> Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400">DAU/MAU</p>
            <p className="text-lg font-bold text-slate-100">{dauMau}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400">Opens/User/Wk</p>
            <p className="text-lg font-bold text-slate-100">{avgOpensPerWeek}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400">Active 7d / 30d</p>
            <p className="text-lg font-bold text-slate-100">{activeUsers7d} / {activeUsers30d}</p>
          </div>
        </div>

        {/* 14-day inactive churches */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-3.5 w-3.5 ${inactiveChurches.length > 0 ? "text-amber-400" : "text-emerald-400"}`} />
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              Churn Risk — No activity in 14 days ({inactiveChurches.length})
            </p>
          </div>
          {inactiveChurches.length === 0 ? (
            <p className="text-xs text-emerald-400">All churches active. 🎉</p>
          ) : (
            <div className="space-y-1">
              {inactiveChurches.map(c => (
                <div key={c.id} className="text-sm text-slate-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
