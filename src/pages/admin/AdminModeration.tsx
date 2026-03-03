import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Flag, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  content_type: string;
  content_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter?: { first_name: string; last_name: string; username: string };
  reported?: { first_name: string; last_name: string; username: string };
}

export default function AdminModeration() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "reviewed" | "all">("pending");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports", churchId, filter],
    queryFn: async () => {
      let query = supabase
        .from("content_reports" as any)
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      if (filter === "pending") query = query.eq("status", "pending");
      else if (filter === "reviewed") query = query.in("status", ["reviewed", "dismissed", "actioned"]);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for reporters and reported users
      const userIds = [...new Set((data || []).flatMap((r: any) => [r.reporter_id, r.reported_user_id]))];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles_safe").select("user_id, first_name, last_name, username").in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return (data || []).map((r: any) => ({
        ...r,
        reporter: profileMap.get(r.reporter_id),
        reported: profileMap.get(r.reported_user_id),
      })) as Report[];
    },
    enabled: !!churchId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("content_reports" as any)
        .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: "Report updated" });
    },
  });

  const reasonLabel = (r: string) => {
    switch (r) {
      case "spam": return "Spam";
      case "harassment": return "Harassment";
      case "inappropriate": return "Inappropriate";
      default: return "Other";
    }
  };

  const contentTypeLabel = (t: string) => {
    switch (t) {
      case "prayer_request": return "Prayer Request";
      case "group_message": return "Group Message";
      case "profile": return "Profile";
      default: return t;
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Flag className="h-5 w-5 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Content Moderation</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "reviewed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "pending" ? "No pending reports — all clear!" : "No reports found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      {reasonLabel(report.reason)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {contentTypeLabel(report.content_type)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      report.status === "pending"
                        ? "bg-accent/20 text-accent-foreground"
                        : report.status === "actioned"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="text-sm text-foreground mt-2">
                    <span className="text-muted-foreground">Reported:</span>{" "}
                    <span className="font-semibold">
                      {report.reported ? `${report.reported.first_name} ${report.reported.last_name}` : "Unknown"}
                    </span>
                    {report.reported?.username && (
                      <span className="text-muted-foreground ml-1">@{report.reported.username}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By: {report.reporter ? `${report.reporter.first_name} ${report.reporter.last_name}` : "Unknown"}
                    {" · "}
                    {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {report.details && (
                    <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded-lg p-3">
                      {report.details}
                    </p>
                  )}
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: report.id, status: "dismissed" })}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Dismiss
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: report.id, status: "actioned" })}
                      disabled={updateMutation.isPending}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Action
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
