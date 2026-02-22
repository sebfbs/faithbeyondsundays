import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bell } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotifications() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Get all member user_ids for this church
  const { data: members } = useQuery({
    queryKey: ["admin", "member-ids", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("church_id", churchId);
      if (error) throw error;
      return data.map((m) => m.user_id);
    },
  });

  // Recent notification log
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin", "notification-logs", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      // Get member ids first, then their notifications
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("church_id", churchId);

      if (!profiles?.length) return [];

      const userIds = profiles.map((p) => p.user_id);
      const { data, error } = await supabase
        .from("notification_log")
        .select("id, title, body, status, created_at, notification_type")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!members?.length) {
      toast.error("No members to send to");
      return;
    }
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_ids: members,
            notification_type: "new_sermon",
            title,
            body,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send");
      toast.success(`Sent to ${result.sent} device(s)${result.skipped ? `, ${result.skipped} skipped` : ""}`);
      setTitle("");
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Push Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send push notifications to your {members?.length ?? 0} church members
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New sermon available!"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Check out this week's sermon and get your daily spark..."
                rows={3}
                required
              />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to All Members
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recent Notifications</h2>
        {logsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !recentLogs?.length ? (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications sent yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <Card key={log.id} className="shadow-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      log.status === "sent" ? "bg-emerald-500" : "bg-destructive"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{log.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
