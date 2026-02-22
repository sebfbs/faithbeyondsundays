import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface FeatureFlags {
  community: boolean;
  prayer: boolean;
  giving: boolean;
}

const DEFAULTS: FeatureFlags = {
  community: true,
  prayer: true,
  giving: true,
};

export function useFeatureFlags(): FeatureFlags {
  const { profile } = useProfile();
  const churchId = profile?.church_id;

  const { data } = useQuery({
    queryKey: ["feature-flags", churchId],
    queryFn: async (): Promise<FeatureFlags> => {
      if (!churchId) return DEFAULTS;
      const { data: rows, error } = await supabase
        .from("church_feature_flags")
        .select("feature_key, enabled")
        .eq("church_id", churchId);

      if (error || !rows?.length) return DEFAULTS;

      const flags = { ...DEFAULTS };
      for (const row of rows) {
        if (row.feature_key in flags) {
          (flags as any)[row.feature_key] = row.enabled;
        }
      }
      return flags;
    },
    enabled: !!churchId,
    staleTime: 10 * 60 * 1000,
  });

  return data || DEFAULTS;
}
