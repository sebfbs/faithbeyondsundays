import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blockedIds = [] } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_users" as any)
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      return (data || []).map((r: any) => r.blocked_id as string);
    },
    enabled: !!user,
  });

  const blockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from("blocked_users" as any)
        .insert({ blocker_id: user!.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from("blocked_users" as any)
        .delete()
        .eq("blocker_id", user!.id)
        .eq("blocked_id", blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });

  return {
    blockedIds,
    isBlocked: (userId: string) => blockedIds.includes(userId),
    block: blockMutation.mutateAsync,
    unblock: unblockMutation.mutateAsync,
  };
}
