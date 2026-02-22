import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformAnalytics() {
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
        .select("id, church_id, event_type, created_at");
      if (error) throw error;
      return data;
    },
  });

  return {
    churches: churchesQuery.data ?? [],
    members: membersQuery.data ?? [],
    sermons: sermonsQuery.data ?? [],
    events: eventsQuery.data ?? [],
    loading:
      churchesQuery.isLoading ||
      membersQuery.isLoading ||
      sermonsQuery.isLoading ||
      eventsQuery.isLoading,
  };
}
