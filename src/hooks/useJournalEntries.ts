import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";
import { useProfile } from "./useProfile";

export interface JournalEntry {
  id: string;
  date: string;
  type: "sermon" | "challenge" | "reflection" | "personal";
  tag: string;
  preview: string;
  sermonTitle: string;
  bookmarked: boolean;
  fullText: string;
  suggestedScripture?: {
    reference: string;
    text: string;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dbToUI(row: any): JournalEntry {
  return {
    id: row.id,
    date: formatDate(row.created_at),
    type: (["reflection", "personal", "challenge"].includes(row.entry_type) ? row.entry_type : "sermon") as JournalEntry["type"],
    tag: row.entry_type === "challenge" ? "Challenge" : row.entry_type === "reflection" ? "Daily Reflection" : row.entry_type === "personal" ? "Personal" : "Daily Reflection",
    preview: row.content.slice(0, 120) + (row.content.length > 120 ? "..." : ""),
    sermonTitle: row.title || "Reflection",
    bookmarked: row.is_bookmarked,
    fullText: row.content,
    suggestedScripture: row.suggested_scripture_ref
      ? { reference: row.suggested_scripture_ref, text: row.suggested_scripture_text || "" }
      : undefined,
  };
}

export function useJournalEntries() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const queryKey = ["journal-entries", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Journal fetch error:", error);
        return [];
      }
      return (data || []).map(dbToUI);
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      content: string;
      title?: string;
      entryType?: string;
      sermonId?: string;
      suggestedScriptureRef?: string;
      suggestedScriptureText?: string;
    }) => {
      if (!user || !profile) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          church_id: profile.church_id || null,
          content: entry.content,
          title: entry.title || null,
          entry_type: entry.entryType || "sermon",
          sermon_id: entry.sermonId || null,
          suggested_scripture_ref: entry.suggestedScriptureRef || null,
          suggested_scripture_text: entry.suggestedScriptureText || null,
        })
        .select()
        .single();
      if (error) throw error;
      return dbToUI(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateEntry = useMutation({
    mutationFn: async (entry: { id: string; content: string; title?: string; isBookmarked?: boolean }) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          content: entry.content,
          title: entry.title || null,
          ...(entry.isBookmarked !== undefined ? { is_bookmarked: entry.isBookmarked } : {}),
        })
        .eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleBookmark = useMutation({
    mutationFn: async ({ id, bookmarked }: { id: string; bookmarked: boolean }) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({ is_bookmarked: bookmarked })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleBookmark,
  };
}
