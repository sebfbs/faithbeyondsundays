import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Church, Users, BookOpen, Hand, Smartphone, Loader2, UserCheck, UserCheck2, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import FinancialOverview from "@/components/platform/FinancialOverview";
import EngagementMetrics from "@/components/platform/EngagementMetrics";
import PlatformHealthCard from "@/components/platform/PlatformHealthCard";

export default function PlatformDashboard() {
  const analytics = usePlatformAnalytics();
  const { churches, members, sermons, events, loading } = analytics;

  const activeChurches = churches.filter((c) => c.is_active).length;
  const totalMembers = members.length;
  const totalSermons = sermons.length;
  const giveTaps = events.filter((e) => e.event_type === "give_tap").length;
  const appOpens = events.filter((e) => e.event_type === "app_open").length;
  const avgMembersPerChurch = activeChurches > 0 ? (totalMembers / activeChurches).toFixed(1) : "—";

  const [chartMetric, setChartMetric] = useState<"signups" | "app_open" | "give_tap">("signups");

  const chartData = useMemo(() => {
    const days = 30;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      buckets[format(subDays(new Date(), i), "MMM d")] = 0;
    }
    if (chartMetric === "signups") {
      members.forEach((m) => {
        const key = format(new Date(m.created_at), "MMM d");
        if (key in buckets) buckets[key]++;
      });
    } else {
      events
        .filter((e) => e.event_type === chartMetric)
        .forEach((e) => {
          const key = format(new Date(e.created_at), "MMM d");
          if (key in buckets) buckets[key]++;
        });
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [members, events, chartMetric]);

  // Trend: compare last 15 days vs prior 15 days
  const trend = useMemo(() => {
    const mid = Math.floor(chartData.length / 2);
    const recent = chartData.slice(mid).reduce((s, d) => s + d.count, 0);
    const prior = chartData.slice(0, mid).reduce((s, d) => s + d.count, 0);
    if (prior === 0) return null;
    return ((recent - prior) / prior) * 100;
  }, [chartData]);

  const topChurches = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => { counts[e.church_id] = (counts[e.church_id] || 0) + 1; });
    return churches
      .map((c) => ({ name: c.name, events: counts[c.id] || 0 }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 5);
  }, [churches, events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const stats = [
    { label: "Active Churches", value: activeChurches, icon: Church, color: "text-blue-400", note: undefined },
    { label: "Total Members", value: totalMembers, icon: Users, color: "text-emerald-400", note: undefined },
    { label: "Sermons", value: totalSermons, icon: BookOpen, color: "text-violet-400", note: undefined },
    { label: "Give Taps", value: giveTaps, icon: Hand, color: "text-amber-400", note: undefined },
    { label: "App Opens", value: appOpens, icon: Smartphone, color: "text-cyan-400", note: "counts sessions, not raw opens" },
    { label: "Active 7d", value: analytics.activeUsers7d, icon: UserCheck, color: "text-green-400", note: undefined },
    { label: "Active 30d", value: analytics.activeUsers30d, icon: UserCheck2, color: "text-teal-400", note: undefined },
    { label: "Avg/Church", value: avgMembersPerChurch, icon: BarChart3, color: "text-pink-400", note: undefined },
  ];

  const metricOptions: { key: "signups" | "app_open" | "give_tap"; label: string }[] = [
    { key: "signups", label: "Signups" },
    { key: "app_open", label: "App Opens" },
    { key: "give_tap", label: "Give Taps" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[10px] text-slate-400 truncate">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-slate-100">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              {s.note && <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">"{s.note}"</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial + Health side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialOverview
          totalSermonMinutes={analytics.totalSermonMinutes}
          completedJobCount={analytics.completedJobCount}
          costConfig={analytics.costConfig}
          costConfigItems={analytics.costConfigItems}
          expenses={analytics.expenses}
          addExpense={analytics.addExpense}
          updateExpense={analytics.updateExpense}
          deleteExpense={analytics.deleteExpense}
          updateCostConfig={analytics.updateCostConfig}
        />
        <PlatformHealthCard
          jobsByStatus={analytics.jobsByStatus}
          recentFailures={analytics.recentFailures}
          allFailures={analytics.allFailures}
          successRate={analytics.successRate}
          totalJobs={analytics.totalJobs}
          storageBytes={analytics.storageBytes}
          churches={analytics.churches}
        />
      </div>

      {/* Growth chart + Engagement side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm text-slate-300">Growth — Last 30 Days</CardTitle>
              {trend !== null && (
                <span className={`text-xs ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(0)}% vs prior period
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {metricOptions.map(m => (
                <button
                  key={m.key}
                  onClick={() => setChartMetric(m.key)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors ${chartMetric === m.key ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 22%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(220 15% 55%)", fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "hsl(220 15% 55%)", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 22%)", borderRadius: 8, color: "hsl(40 30% 95%)" }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(38 100% 50%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <EngagementMetrics
          activeUsers7d={analytics.activeUsers7d}
          activeUsers30d={analytics.activeUsers30d}
          totalMembers={totalMembers}
          events={events}
          inactiveChurches={analytics.inactiveChurches}
        />
      </div>

      {/* Top churches */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">Most Active Churches</CardTitle>
        </CardHeader>
        <CardContent>
          {topChurches.length === 0 ? (
            <p className="text-sm text-slate-500">No activity data yet.</p>
          ) : (
            <div className="space-y-3">
              {topChurches.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{c.name}</span>
                  <span className="text-sm font-medium text-slate-400">{c.events} events</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
