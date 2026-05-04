import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Announcement {
  id: string;
  church_id: string;
  created_by: string | null;
  body: string;
  link_url: string | null;
  created_at: string;
}

export default function AdminAnnouncements() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin", "announcements", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("announcements")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const post = async () => {
    if (!body.trim() || !churchId || !user) return;
    setPosting(true);
    try {
      const { error } = await (supabase as any).from("announcements").insert({
        church_id: churchId,
        created_by: user.id,
        body: body.trim(),
        link_url: linkUrl.trim() || null,
      });
      if (error) throw error;
      setBody("");
      setLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements", churchId] });
      toast.success("Announcement posted");
    } catch (err) {
      console.error("post announcement:", err);
      toast.error("Failed to post announcement");
    } finally {
      setPosting(false);
    }
  };

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements", churchId] });
      toast.success("Announcement deleted");
    },
    onError: (err) => {
      console.error("delete announcement:", err);
      toast.error("Failed to delete announcement");
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Post updates that appear on your congregation's home screen.
        </p>
      </div>

      {/* Post form */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write an announcement for your congregation..."
            className="w-full h-28 text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground leading-relaxed rounded-xl p-3 border border-border focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ background: "hsl(var(--muted))" }}
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Optional link URL (https://...)"
            className="w-full text-sm text-foreground outline-none placeholder:text-muted-foreground rounded-xl p-3 border border-border focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ background: "hsl(var(--muted))" }}
          />
          <Button
            onClick={post}
            disabled={!body.trim() || posting}
            className="w-full"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Post Announcement
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !announcements?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">
          No announcements yet. Post one above and it'll appear on your members' home screen instantly.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{a.body}</p>
                  {a.link_url && (
                    <a
                      href={a.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {a.link_url}
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteAnnouncement.mutate(a.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  {deleteAnnouncement.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
