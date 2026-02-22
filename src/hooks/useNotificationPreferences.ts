import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";

export type NotificationType =
  | "new_sermon"
  | "daily_spark"
  | "daily_reflection"
  | "new_follower"
  | "prayer_for_you"
  | "sermon_processing_complete";

export interface NotificationPreference {
  notification_type: NotificationType;
  enabled: boolean;
  days: string[] | null;
  preferred_time: string | null;
}

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_TIME = "Morning (8 AM)";

const ALL_TYPES: NotificationType[] = [
  "new_sermon",
  "daily_spark",
  "daily_reflection",
  "new_follower",
  "prayer_for_you",
  "sermon_processing_complete",
];

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("notification_preferences")
      .select("notification_type, enabled, days, preferred_time")
      .eq("user_id", user.id);

    // Merge with defaults for any missing types
    const existing = new Map(
      (data || []).map((p) => [p.notification_type, p])
    );

    const merged = ALL_TYPES.map((type) => {
      if (existing.has(type)) {
        return existing.get(type) as NotificationPreference;
      }
      // Defaults
      const isDaily = type === "daily_spark" || type === "daily_reflection";
      return {
        notification_type: type,
        enabled: true,
        days: isDaily ? DEFAULT_DAYS : null,
        preferred_time: isDaily ? DEFAULT_TIME : null,
      };
    });

    setPreferences(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(
    async (
      type: NotificationType,
      updates: Partial<Pick<NotificationPreference, "enabled" | "days" | "preferred_time">>
    ) => {
      if (!user) return;

      const current = preferences.find((p) => p.notification_type === type);
      const updated = { ...current, ...updates };

      // Optimistic update
      setPreferences((prev) =>
        prev.map((p) =>
          p.notification_type === type ? { ...p, ...updates } : p
        )
      );

      await supabase.from("notification_preferences").upsert(
        {
          user_id: user.id,
          notification_type: type,
          enabled: updated.enabled ?? true,
          days: updated.days ?? null,
          preferred_time: updated.preferred_time ?? null,
        },
        { onConflict: "user_id,notification_type" }
      );
    },
    [user, preferences]
  );

  return { preferences, loading, updatePreference, refetch: fetchPreferences };
}
