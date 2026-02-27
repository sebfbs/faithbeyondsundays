import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { SermonUIData } from "./useCurrentSermon";
import type { Json } from "@/integrations/supabase/types";

function formatSermonDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getDayOfWeek(): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function transformContent(contentRows: { content_type: string; content: Json }[]) {
  const byType: Record<string, any> = {};
  for (const row of contentRows) {
    byType[row.content_type] = row.content;
  }

  const sparkRaw = byType["spark"];
  let spark = "";
  let sparkData: { day: string; title: string; summary: string }[] | null = null;

  if (sparkRaw?.sparks && Array.isArray(sparkRaw.sparks)) {
    sparkData = sparkRaw.sparks;
    const today = getDayOfWeek();
    const todaySpark = sparkData.find((s: any) => s.day === today) || sparkData[0];
    spark = todaySpark ? `${todaySpark.title} — ${todaySpark.summary}` : "";
  } else {
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

export function usePreviousSermons() {
  const { profile } = useProfile();
  const churchId = profile?.church_id;

  return useQuery({
    queryKey: ["previous-sermons", churchId],
    queryFn: async (): Promise<SermonUIData[]> => {
      if (!churchId) return [];

      const { data: sermons, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("church_id", churchId)
        .eq("is_published", true)
        .eq("is_current", false)
        .order("sermon_date", { ascending: false })
        .limit(50);

      if (error || !sermons?.length) return [];

      const sermonIds = sermons.map((s) => s.id);
      const { data: allContent } = await supabase
        .from("sermon_content")
        .select("sermon_id, content_type, content")
        .in("sermon_id", sermonIds);

      const contentBySermon: Record<string, { content_type: string; content: Json }[]> = {};
      for (const row of allContent || []) {
        if (!contentBySermon[row.sermon_id]) contentBySermon[row.sermon_id] = [];
        contentBySermon[row.sermon_id].push(row);
      }

      return sermons.map((sermon) => {
        const content = transformContent(contentBySermon[sermon.id] || []);
        return {
          id: sermon.id,
          title: sermon.title,
          date: formatSermonDate(sermon.sermon_date),
          subtitle: sermon.subtitle,
          speaker: sermon.speaker,
          church: profile?.church_name || "",
          duration: sermon.duration,
          videoUrl: sermon.video_url,
          sourceUrl: sermon.source_url,
          sourceType: sermon.source_type,
          thumbnailUrl: sermon.thumbnail_url,
          storagePath: sermon.storage_path,
          ...content,
        };
      });
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
  });
}
