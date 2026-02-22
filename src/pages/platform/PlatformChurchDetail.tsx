import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BookOpen, Hand, Smartphone, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { format, subDays } from "date-fns";

export default function PlatformChurchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const churchQuery = useQuery({
    queryKey: ["platform", "church", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("churches").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: ["platform", "church-members", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, created_at").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const sermonsQuery = useQuery({
    queryKey: ["platform", "church-sermons", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("id").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: ["platform", "church-events", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events").select("id, event_type, created_at").eq("church_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const church = churchQuery.data;
  const members = membersQuery.data ?? [];
  const sermonCount = sermonsQuery.data?.length ?? 0;
  const events = eventsQuery.data ?? [];

  const giveTaps = events.filter((e) => e.event_type === "give_tap").length;
  const appOpens = events.filter((e) => e.event_type === "app_open").length;

  const memberChart = useMemo(() => {
    const days = 30;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      buckets[format(subDays(new Date(), i), "MMM d")] = 0;
    }
    members.forEach((m) => {
      const key = format(new Date(m.created_at), "MMM d");
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [members]);

  const loading = churchQuery.isLoading || membersQuery.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Church not found.</p>
        <Button variant="ghost" className="mt-4 text-slate-300" onClick={() => navigate("/platform/churches")}>
          Back to churches
        </Button>
      </div>
    );
  }

  const stats = [
    { label: "Members", value: members.length, icon: Users, color: "text-emerald-400" },
    { label: "Sermons", value: sermonCount, icon: BookOpen, color: "text-violet-400" },
    { label: "Give Taps", value: giveTaps, icon: Hand, color: "text-amber-400" },
    { label: "App Opens", value: appOpens, icon: Smartphone, color: "text-cyan-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200" onClick={() => navigate("/platform/churches")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{church.name}</h1>
          <p className="text-sm text-slate-400">{[church.city, church.state].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-300">New Members — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memberChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 22%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 22%)", borderRadius: 8, color: "hsl(40 30% 95%)" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(160 60% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
