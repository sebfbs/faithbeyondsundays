import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface LikeData {
  target_type: string;
  target_index: number | null;
  user_id: string;
}

interface TakeawayLikeInfo {
  count: number;
  hasLiked: boolean;
}

export function useSermonLikes(sermonId: string | undefined) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const queryKey = ["sermon-likes", sermonId];

  const { data: likes = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!sermonId) return [];
      const { data, error } = await supabase
        .from("sermon_likes" as any)
        .select("target_type, target_index, user_id")
        .eq("sermon_id", sermonId);
      if (error) throw error;
      return (data || []) as unknown as LikeData[];
    },
    enabled: !!sermonId,
    staleTime: 30_000,
  });

  // Derived state
  const sermonLikes = likes.filter((l) => l.target_type === "sermon");
  const sermonLikeCount = sermonLikes.length;
  const hasLikedSermon = !!userId && sermonLikes.some((l) => l.user_id === userId);

  const takeawayLikesMap: Record<number, TakeawayLikeInfo> = {};
  for (const l of likes.filter((l) => l.target_type === "takeaway")) {
    const idx = l.target_index ?? 0;
    if (!takeawayLikesMap[idx]) {
      takeawayLikesMap[idx] = { count: 0, hasLiked: false };
    }
    takeawayLikesMap[idx].count++;
    if (userId && l.user_id === userId) {
      takeawayLikesMap[idx].hasLiked = true;
    }
  }

  const getTakeawayLikes = (index: number): TakeawayLikeInfo =>
    takeawayLikesMap[index] || { count: 0, hasLiked: false };

  const toggleLike = useMutation({
    mutationFn: async ({
      targetType,
      targetIndex,
    }: {
      targetType: "sermon" | "takeaway";
      targetIndex: number | null;
    }) => {
      if (!sermonId || !userId) return;

      const isLiked =
        targetType === "sermon"
          ? hasLikedSermon
          : getTakeawayLikes(targetIndex ?? 0).hasLiked;

      if (isLiked) {
        let query = supabase
          .from("sermon_likes" as any)
          .delete()
          .eq("sermon_id", sermonId)
          .eq("user_id", userId)
          .eq("target_type", targetType);
        if (targetIndex !== null) {
          query = query.eq("target_index", targetIndex);
        } else {
          query = query.is("target_index", null);
        }
        const { error } = await query;
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sermon_likes" as any).insert({
          sermon_id: sermonId,
          user_id: userId,
          target_type: targetType,
          target_index: targetIndex,
        });
        if (error) throw error;
      }
    },
    onMutate: async ({ targetType, targetIndex }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<LikeData[]>(queryKey) || [];

      const isLiked =
        targetType === "sermon"
          ? hasLikedSermon
          : getTakeawayLikes(targetIndex ?? 0).hasLiked;

      const next = isLiked
        ? prev.filter(
            (l) =>
              !(
                l.target_type === targetType &&
                l.target_index === targetIndex &&
                l.user_id === userId
              )
          )
        : [
            ...prev,
            { target_type: targetType, target_index: targetIndex, user_id: userId! },
          ];

      queryClient.setQueryData(queryKey, next);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleSermonLike = () =>
    toggleLike.mutate({ targetType: "sermon", targetIndex: null });

  const toggleTakeawayLike = (index: number) =>
    toggleLike.mutate({ targetType: "takeaway", targetIndex: index });

  return {
    sermonLikeCount,
    hasLikedSermon,
    getTakeawayLikes,
    toggleSermonLike,
    toggleTakeawayLike,
    isAuthenticated: !!userId,
  };
}
