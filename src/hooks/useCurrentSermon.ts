import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Json } from "@/integrations/supabase/types";

async function resolveStorageUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  const { data } = await supabase.storage.from("sermon-media").createSignedUrl(storagePath, 3600);
  return data?.signedUrl || null;
}

export interface SermonUIData {
  id: string;
  title: string;
  date: string;
  subtitle: string | null;
  speaker: string | null;
  church: string;
  duration: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  sourceType: "upload" | "youtube" | "vimeo";
  thumbnailUrl: string | null;
  storagePath: string | null;
  chapters: { title: string; timestamp: string }[];
  scriptures: { reference: string; text: string }[];
  takeaways: string[];
  reflectionQuestions: string[];
  spark: string;
  sparkData: { day: string; title: string; summary: string }[] | null;
}

function formatSermonDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getDayOfWeek(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function transformContent(contentRows: { content_type: string; content: Json }[]): {
  chapters: { title: string; timestamp: string }[];
  scriptures: { reference: string; text: string }[];
  takeaways: string[];
  reflectionQuestions: string[];
  spark: string;
  sparkData: { day: string; title: string; summary: string }[] | null;
} {
  const byType: Record<string, any> = {};
  for (const row of contentRows) {
    byType[row.content_type] = row.content;
  }

  const sparkRaw = byType["spark"];
  let spark = "";
  let sparkData: { day: string; title: string; summary: string }[] | null = null;

  if (sparkRaw?.sparks && Array.isArray(sparkRaw.sparks)) {
    // New 7-day format
    sparkData = sparkRaw.sparks;
    const today = getDayOfWeek();
    const todaySpark = sparkData.find((s: any) => s.day === today) || sparkData[0];
    spark = todaySpark ? `${todaySpark.title} — ${todaySpark.summary}` : "";
  } else {
    // Legacy single spark format
    spark = sparkRaw?.summary || sparkRaw?.title || "";
  }

  const takeawaysData = byType["takeaways"];
  const takeaways: string[] = (takeawaysData?.takeaways || []).map(
    (t: any) => t.description ? `${t.title} — ${t.description}` : t.title || t
  );

  const reflectionData = byType["reflection_questions"];
  const reflectionQuestions: string[] = (reflectionData?.questions || []).map(
    (q: any) => q.question || q
  );

  const scripturesData = byType["scriptures"];
  const scriptures = (scripturesData?.scriptures || []).map((s: any) => ({
    reference: s.reference || "",
    text: s.text || "",
  }));

  const chaptersData = byType["chapters"];
  const chapters = (chaptersData?.chapters || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((c: any) => ({
      title: c.title || "",
      timestamp: c.timestamp || "",
    }));

  return { chapters, scriptures, takeaways, reflectionQuestions, spark, sparkData };
}

export function useCurrentSermon() {
  const { profile } = useProfile();
  const churchId = profile?.church_id;

  return useQuery({
    queryKey: ["current-sermon", churchId],
    queryFn: async (): Promise<SermonUIData | null> => {
      if (!churchId) return null;

      const today = new Date().toISOString().split("T")[0];

      // Primary: find published sermon whose week range covers today
      let { data: sermon, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("church_id", churchId)
        .eq("is_published", true)
        .lte("week_start", today)
        .gte("week_end", today)
        .order("sermon_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback 1: is_current flag (backward compat for old data without week_start)
      if (!sermon) {
        const fallback = await supabase
          .from("sermons")
          .select("*")
          .eq("church_id", churchId)
          .eq("is_published", true)
          .eq("is_current", true)
          .maybeSingle();
        sermon = fallback.data;
        error = fallback.error;
      }

      // Fallback 2: most recent published sermon (graceful degradation)
      if (!sermon) {
        const fallback2 = await supabase
          .from("sermons")
          .select("*")
          .eq("church_id", churchId)
          .eq("is_published", true)
          .order("sermon_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        sermon = fallback2.data;
        error = fallback2.error;
      }

      if (error || !sermon) return null;

      const { data: contentRows } = await supabase
        .from("sermon_content")
        .select("content_type, content")
        .eq("sermon_id", sermon.id);

      const content = transformContent(contentRows || []);

      // Resolve video URL: prefer video_url, then generate from storage_path
      const videoUrl = sermon.video_url || await resolveStorageUrl(sermon.storage_path);
      const thumbnailUrl = sermon.thumbnail_url && !sermon.thumbnail_url.startsWith("http")
        ? await resolveStorageUrl(sermon.thumbnail_url)
        : sermon.thumbnail_url;

      return {
        id: sermon.id,
        title: sermon.title,
        date: formatSermonDate(sermon.sermon_date),
        subtitle: sermon.subtitle,
        speaker: sermon.speaker,
        church: profile?.church_name || "",
        duration: sermon.duration,
        videoUrl,
        sourceUrl: sermon.source_url,
        sourceType: sermon.source_type,
        thumbnailUrl,
        storagePath: sermon.storage_path,
        ...content,
      };
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
  });
}
