import { usePlatformAnalytics } from "@/hooks/usePlatformAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Church, Users, BookOpen, Hand, Smartphone, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";

export default function PlatformDashboard() {
  const { churches, members, sermons, events, loading } = usePlatformAnalytics();

  const activeChurches = churches.filter((c) => c.is_active).length;
  const totalMembers = members.length;
  const totalSermons = sermons.length;
  const giveTaps = events.filter((e) => e.event_type === "give_tap").length;
  const appOpens = events.filter((e) => e.event_type === "app_open").length;

  // Signups over last 30 days
  const signupChart = useMemo(() => {
    const days = 30;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), "MMM d");
      buckets[key] = 0;
    }
    members.forEach((m) => {
      const key = format(new Date(m.created_at), "MMM d");
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [members]);

  // Most active churches by event count
  const topChurches = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.church_id] = (counts[e.church_id] || 0) + 1;
    });
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
    { label: "Active Churches", value: activeChurches, icon: Church, color: "text-blue-400" },
    { label: "Total Members", value: totalMembers, icon: Users, color: "text-emerald-400" },
    { label: "Sermons", value: totalSermons, icon: BookOpen, color: "text-violet-400" },
    { label: "Give Taps", value: giveTaps, icon: Hand, color: "text-amber-400" },
    { label: "App Opens", value: appOpens, icon: Smartphone, color: "text-cyan-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signups chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">New Signups — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 22%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 22%)", borderRadius: 8, color: "hsl(40 30% 95%)" }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(38 100% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
