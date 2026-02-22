import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export function usePlatformAnalytics() {
  const queryClient = useQueryClient();

  const churchesQuery = useQuery({
    queryKey: ["platform", "churches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["platform", "members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, church_id, created_at");
      if (error) throw error;
      return data;
    },
  });

  const sermonsQuery = useQuery({
    queryKey: ["platform", "sermons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("id, church_id");
      if (error) throw error;
      return data;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["platform", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, church_id, event_type, created_at, user_id");
      if (error) throw error;
      return data;
    },
  });

  const sermonJobsQuery = useQuery({
    queryKey: ["platform", "sermon_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermon_jobs")
        .select("id, status, error_message, failed_at, created_at, sermon_id, church_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const expensesQuery = useQuery({
    queryKey: ["platform", "expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_expenses" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const costConfigQuery = useQuery({
    queryKey: ["platform", "cost_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_cost_config" as any)
        .select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  // Mutations for expenses
  const addExpense = useMutation({
    mutationFn: async (expense: { name: string; amount_cents: number; frequency: string; category: string; notes?: string }) => {
      const { error } = await supabase.from("platform_expenses" as any).insert(expense as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "expenses"] }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; amount_cents?: number; frequency?: string; category?: string; notes?: string }) => {
      const { error } = await supabase.from("platform_expenses" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "expenses"] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_expenses" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "expenses"] }),
  });

  // Mutations for cost config
  const updateCostConfig = useMutation({
    mutationFn: async ({ key, value_cents }: { key: string; value_cents: number }) => {
      const { error } = await supabase
        .from("platform_cost_config" as any)
        .update({ value_cents } as any)
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform", "cost_config"] }),
  });

  // Derived: active users
  const now = new Date();
  const events = eventsQuery.data ?? [];
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  const activeUsers7d = new Set(events.filter(e => e.created_at >= sevenDaysAgo).map(e => e.user_id)).size;
  const activeUsers30d = new Set(events.filter(e => e.created_at >= thirtyDaysAgo).map(e => e.user_id)).size;

  // Derived: inactive churches (14 days)
  const fourteenDaysAgo = subDays(now, 14).toISOString();
  const recentChurchIds = new Set(events.filter(e => e.created_at >= fourteenDaysAgo).map(e => e.church_id));
  const churches = churchesQuery.data ?? [];
  const inactiveChurches = churches.filter(c => c.is_active && !recentChurchIds.has(c.id));

  // Derived: sermon job stats
  const sermonJobs = sermonJobsQuery.data ?? [];
  const jobsByStatus = {
    queued: sermonJobs.filter(j => j.status === "queued").length,
    processing: sermonJobs.filter(j => j.status === "processing").length,
    completed: sermonJobs.filter(j => j.status === "completed").length,
    failed: sermonJobs.filter(j => j.status === "failed").length,
    retrying: sermonJobs.filter(j => j.status === "retrying").length,
  };
  const recentFailures = sermonJobs.filter(j => j.status === "failed").slice(0, 5);
  const totalJobs = sermonJobs.length;
  const successRate = totalJobs > 0 ? (jobsByStatus.completed / totalJobs) * 100 : 100;

  // Cost config as map
  const costConfigMap: Record<string, number> = {};
  (costConfigQuery.data ?? []).forEach((c: any) => {
    costConfigMap[c.key] = c.value_cents;
  });

  return {
    churches,
    members: membersQuery.data ?? [],
    sermons: sermonsQuery.data ?? [],
    events,
    loading:
      churchesQuery.isLoading ||
      membersQuery.isLoading ||
      sermonsQuery.isLoading ||
      eventsQuery.isLoading ||
      sermonJobsQuery.isLoading ||
      expensesQuery.isLoading ||
      costConfigQuery.isLoading,
    // New data
    activeUsers7d,
    activeUsers30d,
    inactiveChurches,
    jobsByStatus,
    recentFailures,
    successRate,
    totalJobs,
    expenses: (expensesQuery.data ?? []) as any[],
    costConfig: costConfigMap,
    costConfigItems: (costConfigQuery.data ?? []) as any[],
    // Mutations
    addExpense,
    updateExpense,
    deleteExpense,
    updateCostConfig,
  };
}
