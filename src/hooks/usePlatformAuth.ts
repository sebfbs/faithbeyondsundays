import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformAuth(redirectIfUnauthorized = true) {
  const { user, loading: authLoading } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsPlatformAdmin(false);
      setChecking(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase
        .from("platform_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const isAdmin = !error && !!data;
      setIsPlatformAdmin(isAdmin);
      setChecking(false);

      if (!isAdmin && redirectIfUnauthorized) {
        navigate("/platform/login", { replace: true });
      }
    };

    check();
  }, [user, authLoading, navigate, redirectIfUnauthorized]);

  return {
    user,
    isPlatformAdmin,
    loading: authLoading || checking,
  };
}
