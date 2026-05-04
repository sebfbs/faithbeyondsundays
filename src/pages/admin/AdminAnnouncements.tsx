import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/fbs/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const EXPIRY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "No expiry", days: null },
];

interface Announcement {
  id: string;
  church_id: string;
  created_by: string | null;
  title: string | null;
  body: string | null;
  link_url: string | null;
  created_at: string;
  expires_at: string | null;
}

export default function AdminAnnouncements() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [expiryDays, setExpiryDays] = useState<number | null>(7);
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
    if (!title.trim() || !churchId || !user) return;
    setPosting(true);
    const expires_at = expiryDays
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    try {
      const { error } = await (supabase as any).from("announcements").insert({
        church_id: churchId,
        created_by: user.id,
        title: title.trim(),
        body: body.trim() || null,
        link_url: linkUrl.trim() || null,
        expires_at,
      });
      if (error) throw error;
      setTitle("");
      setBody("");
      setLinkUrl("");
      setExpiryDays(7);
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
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title (required)"
            className="w-full text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-normal rounded-xl p-3 border border-border focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ background: "hsl(var(--muted))" }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add more detail (optional)..."
            className="w-full h-24 text-sm text-foreground resize-none outline-none placeholder:text-muted-foreground leading-relaxed rounded-xl p-3 border border-border focus:ring-2 focus:ring-primary/30 transition-all"
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
          <div className="relative">
            <select
              value={expiryDays ?? "null"}
              onChange={(e) => setExpiryDays(e.target.value === "null" ? null : Number(e.target.value))}
              className="w-full appearance-none text-sm text-foreground rounded-xl px-3 py-3 pr-10 border border-border focus:ring-2 focus:ring-primary/30 transition-all outline-none"
              style={{ background: "hsl(var(--muted))" }}
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={String(opt.days)} value={String(opt.days)}>
                  Expires after: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button
            onClick={post}
            disabled={!title.trim() || posting}
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
                  {a.title && <p className="text-sm font-semibold text-foreground leading-snug">{a.title}</p>}
                  {a.body && <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{a.body}</p>}
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
                    {a.expires_at && (
                      <span className="ml-2">
                        · expires {formatDistanceToNow(new Date(a.expires_at), { addSuffix: true })}
                      </span>
                    )}
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
