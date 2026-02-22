import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Users, BookOpen, TrendingUp, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { churchId } = useOutletContext<{ churchId: string }>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard-stats", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const [sermons, members, entries, events] = await Promise.all([
        supabase.from("sermons").select("id, status", { count: "exact" }).eq("church_id", churchId),
        supabase.from("profiles").select("id", { count: "exact" }).eq("church_id", churchId),
        supabase.from("journal_entries").select("id", { count: "exact" }).eq("church_id", churchId),
        supabase.from("analytics_events").select("id", { count: "exact" }).eq("church_id", churchId),
      ]);
      return {
        totalSermons: sermons.count ?? 0,
        totalMembers: members.count ?? 0,
        totalJournals: entries.count ?? 0,
        totalEvents: events.count ?? 0,
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

  const cards = [
    { label: "Sermons", value: stats?.totalSermons ?? 0, icon: Mic, color: "text-primary" },
    { label: "Members", value: stats?.totalMembers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Journal Entries", value: stats?.totalJournals ?? 0, icon: BookOpen, color: "text-emerald-500" },
    { label: "Total Events", value: stats?.totalEvents ?? 0, icon: TrendingUp, color: "text-violet-500" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your church's activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
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
    </div>
  );
}
