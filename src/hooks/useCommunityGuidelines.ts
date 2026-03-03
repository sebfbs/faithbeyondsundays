import { useState, useCallback } from "react";
import { useAuth } from "@/components/fbs/AuthProvider";

const STORAGE_KEY = "fbs_guidelines_accepted";

/**
 * Tracks whether the current user has acknowledged community guidelines.
 * Persisted in localStorage per user so the dialog only shows once.
 */
export function useCommunityGuidelines() {
  const { user } = useAuth();
  const key = user ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;

  const [accepted, setAccepted] = useState(() => {
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });

  const accept = useCallback(() => {
    try {
      localStorage.setItem(key, "true");
    } catch {}
    setAccepted(true);
  }, [key]);

  return { accepted, accept };
}
