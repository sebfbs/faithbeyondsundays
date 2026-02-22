import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";

export interface UserProfile {
  id: string;
  user_id: string;
  church_id: string | null;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram_handle: string | null;
  phone_number: string | null;
  show_phone_number: boolean;
  streak_current: number;
  streak_longest: number;
  challenges_completed: number;
  onboarding_complete: boolean;
  is_email_verified: boolean;
  // Joined fields
  church_name?: string;
  church_code?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, churches(name, code)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const church = data.churches as any;
      setProfile({
        ...data,
        church_name: church?.name || "",
        church_code: church?.code || "",
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return { profile, loading, refetch: fetchProfile };
}
