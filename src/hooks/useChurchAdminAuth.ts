import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/fbs/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface ChurchAdminAuth {
  user: any;
  churchId: string | null;
  role: string | null;
  loading: boolean;
  isChurchAdmin: boolean;
}

export function useChurchAdminAuth(redirectIfUnauthorized = true): ChurchAdminAuth {
  const { user, loading: authLoading } = useAuth();
  const [churchId, setChurchId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setChecking(false);
      if (redirectIfUnauthorized) {
        navigate("/admin/login", { replace: true });
      }
      return;
    }

    const check = async () => {
      // Check if user has owner, admin, or pastor role in any church
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role, church_id")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin", "pastor"]);

      if (error || !roles || roles.length === 0) {
        setChecking(false);
        if (redirectIfUnauthorized) {
          navigate("/admin/login", { replace: true });
        }
        return;
      }

      // Use highest-priority role
      const priority = ["owner", "admin", "pastor"];
      const sorted = roles.sort(
        (a, b) => priority.indexOf(a.role) - priority.indexOf(b.role)
      );
      setChurchId(sorted[0].church_id);
      setRole(sorted[0].role);
      setChecking(false);
    };

    check();
  }, [user, authLoading, navigate, redirectIfUnauthorized]);

  return {
    user,
    churchId,
    role,
    loading: authLoading || checking,
    isChurchAdmin: !!churchId && !!role,
  };
}
