import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Json } from "@/integrations/supabase/types";

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
  chapters: { title: string; timestamp: string }[];
  scriptures: { reference: string; text: string }[];
  takeaways: string[];
  reflectionQuestions: string[];
  spark: string;
  weeklyChallenge: string;
  weekendReflection: string;
}

function formatSermonDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function transformContent(contentRows: { content_type: string; content: Json }[]): {
  chapters: { title: string; timestamp: string }[];
  scriptures: { reference: string; text: string }[];
  takeaways: string[];
  reflectionQuestions: string[];
  spark: string;
  weeklyChallenge: string;
  weekendReflection: string;
} {
  const byType: Record<string, any> = {};
  for (const row of contentRows) {
    byType[row.content_type] = row.content;
  }

  // Spark
  const sparkData = byType["spark"];
  const spark = sparkData?.summary || sparkData?.title || "";

  // Takeaways
  const takeawaysData = byType["takeaways"];
  const takeaways: string[] = (takeawaysData?.takeaways || []).map(
    (t: any) => t.description ? `${t.title} — ${t.description}` : t.title || t
  );

  // Reflection questions
  const reflectionData = byType["reflection_questions"];
  const reflectionQuestions: string[] = (reflectionData?.questions || []).map(
    (q: any) => q.question || q
  );

  // Scriptures
  const scripturesData = byType["scriptures"];
  const scriptures = (scripturesData?.scriptures || []).map((s: any) => ({
    reference: s.reference || "",
    text: s.text || "",
  }));

  // Chapters
  const chaptersData = byType["chapters"];
  const chapters = (chaptersData?.chapters || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((c: any) => ({
      title: c.title || "",
      timestamp: c.timestamp || "",
    }));

  // Weekly challenge
  const challengeData = byType["weekly_challenge"];
  const weeklyChallenge = challengeData?.challenge || challengeData?.description || "";

  // Weekend reflection
  const weekendData = byType["weekend_reflection"];
  const weekendReflection = weekendData?.prompt || weekendData?.reflection || "";

  return { chapters, scriptures, takeaways, reflectionQuestions, spark, weeklyChallenge, weekendReflection };
}

export function useCurrentSermon() {
  const { profile } = useProfile();
  const churchId = profile?.church_id;

  return useQuery({
    queryKey: ["current-sermon", churchId],
    queryFn: async (): Promise<SermonUIData | null> => {
      if (!churchId) return null;

      // Fetch the current published sermon
      const { data: sermon, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("church_id", churchId)
        .eq("is_published", true)
        .eq("is_current", true)
        .maybeSingle();

      if (error || !sermon) return null;

      // Fetch all content for this sermon
      const { data: contentRows } = await supabase
        .from("sermon_content")
        .select("content_type, content")
        .eq("sermon_id", sermon.id);

      const content = transformContent(contentRows || []);

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
        ...content,
      };
    },
    enabled: !!churchId,
    staleTime: 5 * 60 * 1000,
  });
}
