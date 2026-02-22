import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Users, BookOpen, TrendingUp, Loader2, Activity, Eye } from "lucide-react";
import { subDays, format, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const { churchId } = useOutletContext<{ churchId: string }>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard-stats", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [sermons, members, entries, events] = await Promise.all([
        supabase.from("sermons").select("id, status", { count: "exact" }).eq("church_id", churchId),
        supabase.from("profiles").select("id", { count: "exact" }).eq("church_id", churchId),
        supabase.from("journal_entries").select("id", { count: "exact" }).eq("church_id", churchId),
        supabase.from("analytics_events").select("id, user_id, event_type, created_at").eq("church_id", churchId).gte("created_at", thirtyDaysAgo),
      ]);

      const allEvents = events.data ?? [];

      // Active users
      const activeUsers7d = new Set(
        allEvents.filter(e => e.created_at >= sevenDaysAgo).map(e => e.user_id)
      ).size;
      const activeUsers30d = new Set(allEvents.map(e => e.user_id)).size;

      // Daily activity for chart (last 14 days)
      const fourteenDaysAgo = subDays(now, 14);
      const dailyMap: Record<string, Set<string>> = {};
      for (let i = 0; i < 14; i++) {
        const d = format(subDays(now, 13 - i), "yyyy-MM-dd");
        dailyMap[d] = new Set();
      }
      allEvents.forEach(e => {
        const day = e.created_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].add(e.user_id);
      });
      const dailyActivity = Object.entries(dailyMap).map(([date, users]) => ({
        date: format(new Date(date), "MMM d"),
        users: users.size,
      }));

      // Event type breakdown
      const eventCounts: Record<string, number> = {};
      allEvents.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });
      const topEvents = Object.entries(eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      return {
        totalSermons: sermons.count ?? 0,
        totalMembers: members.count ?? 0,
        totalJournals: entries.count ?? 0,
        totalEvents: allEvents.length,
        activeUsers7d,
        activeUsers30d,
        dailyActivity,
        topEvents,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Sermons", value: stats?.totalSermons ?? 0, icon: Mic, color: "text-primary" },
    { label: "Members", value: stats?.totalMembers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Active (7d)", value: stats?.activeUsers7d ?? 0, icon: Activity, color: "text-emerald-500" },
    { label: "Active (30d)", value: stats?.activeUsers30d ?? 0, icon: Eye, color: "text-violet-500" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your church's activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{c.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Active Users Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Daily Active Users (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dailyActivity ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Engagement breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Content Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Journal Entries</span>
              <span className="text-sm font-semibold text-foreground">{stats?.totalJournals ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground">Total Events (30d)</span>
              <span className="text-sm font-semibold text-foreground">{stats?.totalEvents ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Top Events (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.topEvents ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No events recorded yet.</p>
            ) : (
              stats?.topEvents.map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="text-sm text-foreground truncate">{type.replace(/_/g, " ")}</span>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
