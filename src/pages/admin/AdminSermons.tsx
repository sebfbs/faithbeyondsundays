import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mic,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type SourceMode = "upload" | "youtube";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  uploading: { label: "Uploading", icon: Upload, className: "bg-muted text-muted-foreground" },
  transcribing: { label: "Transcribing", icon: Mic, className: "bg-blue-100 text-blue-700" },
  generating: { label: "Generating", icon: Loader2, className: "bg-amber-100 text-amber-700" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
};

export default function AdminSermons() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ["admin", "sermons", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("church_id", churchId)
        .order("sermon_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((s) => !["complete", "failed"].includes(s.status)) ? 10000 : false;
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("sermons")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sermons"] });
      toast.success("Sermon updated");
    },
  });

  const toggleCurrent = useMutation({
    mutationFn: async ({ id, is_current }: { id: string; is_current: boolean }) => {
      // If setting as current, unset all others first
      if (is_current) {
        await supabase
          .from("sermons")
          .update({ is_current: false })
          .eq("church_id", churchId)
          .eq("is_current", true);
      }
      const { error } = await supabase
        .from("sermons")
        .update({ is_current })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sermons"] });
      toast.success("Current sermon updated");
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sermons</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your sermons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sermon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Sermon</DialogTitle>
            </DialogHeader>
            <UploadSermonForm
              churchId={churchId}
              onSuccess={() => {
                setDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["admin", "sermons"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !sermons?.length ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Mic className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sermons yet. Upload your first sermon to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sermons.map((sermon) => {
            const status = statusConfig[sermon.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Card key={sermon.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{sermon.title}</h3>
                        {sermon.is_current && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">CURRENT</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {sermon.speaker && <span>{sermon.speaker}</span>}
                        <span>{format(new Date(sermon.sermon_date), "MMM d, yyyy")}</span>
                        {sermon.duration && <span>{sermon.duration}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={`${status.className} text-xs gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={sermon.status !== "complete"}
                        onClick={() =>
                          togglePublish.mutate({
                            id: sermon.id,
                            is_published: !sermon.is_published,
                          })
                        }
                      >
                        {sermon.is_published ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" /> Draft
                          </>
                        )}
                      </Button>

                      {sermon.status === "complete" && sermon.is_published && (
                        <Button
                          variant={sermon.is_current ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() =>
                            toggleCurrent.mutate({
                              id: sermon.id,
                              is_current: !sermon.is_current,
                            })
                          }
                        >
                          {sermon.is_current ? "★ Current" : "Set Current"}
                        </Button>
                      )}
                    </div>
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

type UploadStep = "idle" | "uploading" | "finalizing" | "done";

const uploadMessages: Record<string, string[]> = {
  uploading: [
    "Sending your sermon to the cloud ☁️",
    "Your sermon is on its way… 🚀",
    "Hang tight, good things take a moment ✨",
    "Almost there, keep the faith! 🙌",
    "Uploading the good stuff… 📖",
  ],
  finalizing: [
    "Finishing up the magic… ✨",
    "Just a few more seconds… 🎶",
    "Wrapping things up nicely 🎁",
  ],
  done: ["You're all set! 🎉"],
};

function getUploadMessage(step: UploadStep, percent: number): string {
  if (step === "done") return uploadMessages.done[0];
  if (step === "finalizing") return uploadMessages.finalizing[Math.floor(Math.random() * uploadMessages.finalizing.length)];
  if (step === "uploading") {
    const msgs = uploadMessages.uploading;
    const idx = Math.min(Math.floor(percent / 25), msgs.length - 1);
    return msgs[idx];
  }
  return "";
}

function UploadSermonForm({
  churchId,
  onSuccess,
}: {
  churchId: string;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<SourceMode>("upload");
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [friendlyMessage, setFriendlyMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      if (mode === "upload" && file) {
        // Step 1: Upload file with XHR for progress tracking
        setUploadStep("uploading");
        setUploadPercent(0);
        setFriendlyMessage(getUploadMessage("uploading", 0));

        const timestamp = Date.now();
        const storagePath = `${churchId}/${timestamp}-${file.name}`;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadPercent(percent);
              setFriendlyMessage(getUploadMessage("uploading", percent));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`File upload failed (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("File upload failed"));

          xhr.open("POST", `${supabaseUrl}/storage/v1/object/sermon-media/${storagePath}`);
          xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
          xhr.setRequestHeader("x-upsert", "false");
          xhr.send(file);
        });

        // Step 2: Call edge function
        setUploadStep("finalizing");
        setUploadPercent(100);
        setFriendlyMessage(getUploadMessage("finalizing", 100));

        const { data, error: fnError } = await supabase.functions.invoke("upload-sermon", {
          body: {
            title,
            speaker,
            sermon_date: sermonDate,
            storage_path: storagePath,
          },
        });

        if (fnError) throw new Error(fnError.message || "Failed to create sermon");
        if (data?.error) throw new Error(data.error);

        // Brief "done" state
        setUploadStep("done");
        setFriendlyMessage(getUploadMessage("done", 100));
        await new Promise((r) => setTimeout(r, 1200));

        toast.success("Sermon uploaded! Processing will begin shortly.");
        onSuccess();
      } else if (mode === "youtube" && youtubeUrl) {
        const { error } = await supabase.from("sermons").insert({
          title,
          speaker: speaker || null,
          sermon_date: sermonDate,
          church_id: churchId,
          source_type: "youtube",
          source_url: youtubeUrl,
          status: "pending",
          is_published: false,
          is_current: false,
        });
        if (error) throw error;
        toast.success("Sermon added with YouTube link.");
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
      setUploadStep("idle");
      setUploadPercent(0);
    }
  };

  const isUploading = uploadStep !== "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Source mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
          className="flex-1"
          disabled={isUploading}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload File
        </Button>
        <Button
          type="button"
          variant={mode === "youtube" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("youtube")}
          className="flex-1"
          disabled={isUploading}
        >
          <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> YouTube Link
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sermon title" required disabled={isUploading} />
      </div>

      <div className="space-y-2">
        <Label>Speaker</Label>
        <Input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Pastor name" disabled={isUploading} />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" value={sermonDate} onChange={(e) => setSermonDate(e.target.value)} disabled={isUploading} />
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <Label>Audio/Video File *</Label>
          <Input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required={mode === "upload"}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">MP3, MP4, WAV, M4A supported</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>YouTube URL *</Label>
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            required={mode === "youtube"}
            disabled={isUploading}
          />
        </div>
      )}

      {isUploading ? (
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{friendlyMessage}</span>
            <span className="text-foreground font-semibold tabular-nums">{uploadPercent}%</span>
          </div>
          <Progress value={uploadPercent} className="h-3" />
          {uploadStep === "done" && (
            <div className="flex items-center justify-center gap-2 text-primary font-medium pt-1">
              <CheckCircle2 className="h-5 w-5" />
              <span>You're all set!</span>
            </div>
          )}
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {mode === "upload" ? "Upload & Process" : "Add Sermon"}
        </Button>
      )}
    </form>
  );
}
