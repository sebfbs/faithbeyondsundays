import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminPrayer() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();

  const { data: prayers, isLoading } = useQuery({
    queryKey: ["admin", "prayers", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data: prayers, error } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      // Fetch profiles for user display names
      const userIds = [...new Set(prayers.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, first_name, last_name")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach(p => { profileMap[p.user_id] = p; });

      return prayers.map(p => ({ ...p, profile: profileMap[p.user_id] || null }));
    },
  });

  const markAsPrayed = useMutation({
    mutationFn: async (prayerId: string) => {
      const { error } = await supabase
        .from("prayer_requests")
        .update({ is_answered: true, answered_at: new Date().toISOString() })
        .eq("id", prayerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "prayers", churchId] });
      queryClient.invalidateQueries({ queryKey: ["admin-unanswered-prayers", churchId] });
      toast.success("Marked as prayed for");
    },
    onError: () => {
      toast.error("Failed to update prayer request");
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Prayer Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View prayer requests from your church members
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !prayers?.length ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No prayer requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer: any) => {
            const profile = prayer.profile;
            const displayName = profile
              ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username
              : "Anonymous";
            return (
              <Card key={prayer.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {prayer.visibility === "private" ? "Anonymous" : displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(prayer.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                        {prayer.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          🙏 {prayer.prayer_count} prayer{prayer.prayer_count !== 1 ? "s" : ""}
                        </span>
                      {prayer.is_answered && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Answered
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!prayer.is_answered && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs gap-1.5"
                        disabled={markAsPrayed.isPending}
                        onClick={() => markAsPrayed.mutate(prayer.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as Prayed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
