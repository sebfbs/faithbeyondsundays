import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CircleDot,
  Check,
  Sparkles,
  RefreshCw,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Image,
  MoreVertical,
  Trash2,
  Radio,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

type SourceMode = "upload" | "youtube";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  spark: "Daily Sparks",
  takeaways: "Key Takeaways",
  reflection_questions: "Reflection Questions",
  scriptures: "Scripture References",
  chapters: "Sermon Chapters",
};

const TRACKED_CONTENT_TYPES = ["spark", "takeaways", "reflection_questions", "scriptures", "chapters"];

const statusConfig: Record<string, { label: string; icon: any; className: string; animate?: boolean }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  uploading: { label: "Uploading", icon: Loader2, className: "bg-muted text-muted-foreground", animate: true },
  transcribing: { label: "Transcribing", icon: Loader2, className: "bg-blue-100 text-blue-700", animate: true },
  generating: { label: "Generating Content", icon: Loader2, className: "bg-amber-100 text-amber-700", animate: true },
  review: { label: "Ready for Review", icon: Sparkles, className: "bg-purple-100 text-purple-700" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
};

const WIZARD_STEPS = ["thumbnail", "spark", "takeaways", "reflection_questions", "scriptures", "chapters", "confirm"] as const;
type WizardStep = typeof WIZARD_STEPS[number];

const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  thumbnail: "Thumbnail",
  spark: "Daily Sparks",
  takeaways: "Key Takeaways",
  reflection_questions: "Reflection Questions",
  scriptures: "Scripture References",
  chapters: "Sermon Chapters",
  confirm: "Confirm",
};

export default function AdminSermons() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewSermonId, setReviewSermonId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<"review" | "view">("review");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; storagePath: string | null } | null>(null);

  const { data: sermons, isLoading } = useQuery({
    queryKey: ["admin", "sermons", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((s) => !["complete", "failed", "review"].includes(s.status)) ? 10000 : false;
    },
  });

  const generatingIds = sermons?.filter((s) => s.status === "generating").map((s) => s.id) || [];
  const { data: contentProgress } = useQuery({
    queryKey: ["admin", "sermon-content-progress", generatingIds],
    enabled: generatingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermon_content")
        .select("sermon_id, content_type")
        .in("sermon_id", generatingIds);
      if (error) throw error;
      const map: Record<string, Set<string>> = {};
      for (const row of data || []) {
        if (!map[row.sermon_id]) map[row.sermon_id] = new Set();
        (map[row.sermon_id] as Set<string>).add(row.content_type);
      }
      return map;
    },
    refetchInterval: 10000,
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

  const deleteSermon = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string | null }) => {
      // Delete sermon_content rows
      await supabase.from("sermon_content").delete().eq("sermon_id", id);
      // Delete storage file if exists
      if (storagePath) {
        await supabase.storage.from("sermon-media").remove([storagePath]);
      }
      // Delete sermon row
      const { error } = await supabase.from("sermons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sermons"] });
      toast.success("Sermon deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete sermon");
    },
  });

  const approveSermon = useMutation({
    mutationFn: async (id: string) => {
      await supabase
        .from("sermons")
        .update({ is_current: false })
        .eq("church_id", churchId)
        .eq("is_current", true);

      const { error } = await supabase
        .from("sermons")
        .update({ status: "complete", is_published: true, is_current: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setReviewSermonId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "sermons"] });
      toast.success("Sermon approved and scheduled!");
    },
  });

  // Section sermons
  const liveSermon = sermons?.find((s) => s.is_current) || null;
  const needsAttention = sermons?.filter((s) => !s.is_current && (s.status === "review" || s.status === "failed")) || [];
  const processing = sermons?.filter((s) => !s.is_current && ["pending", "uploading", "transcribing", "generating"].includes(s.status)) || [];
  const allSermons = sermons?.filter((s) => !s.is_current && s.status === "complete") || [];

  const openWizard = (sermonId: string, mode: "review" | "view") => {
    setReviewSermonId(sermonId);
    setReviewMode(mode);
  };

  const renderSermonCard = (sermon: any, isLive = false) => {
    const status = statusConfig[sermon.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const doneTypes = contentProgress?.[sermon.id];
    const uploadedAgo = formatDistanceToNow(new Date(sermon.created_at), { addSuffix: true });
    const sourceLabel = sermon.source_type === "youtube" ? "YouTube" : "File Upload";

    return (
      <Card
        key={sermon.id}
        className={`shadow-card transition-all ${isLive ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10" : "cursor-pointer hover:shadow-md"}`}
        onClick={() => {
          if (sermon.status === "complete") openWizard(sermon.id, "view");
          else if (sermon.status === "review") openWizard(sermon.id, "review");
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{sermon.title}</h3>
                {isLive && (
                  <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 gap-1 animate-pulse">
                    <Radio className="h-3 w-3" />
                    LIVE ON YOUR APP
                  </Badge>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                {sermon.speaker && <span>{sermon.speaker}</span>}
                {sermon.speaker && <span>·</span>}
                <span>{format(new Date(sermon.sermon_date), "MMM d, yyyy")}</span>
              </div>

              {/* Upload timestamp */}
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>Uploaded {uploadedAgo}</span>
                <span>·</span>
                <span>{sourceLabel}</span>
              </div>

              {/* Generating progress */}
              {sermon.status === "generating" && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-amber-700">Generating content…</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {TRACKED_CONTENT_TYPES.map((ct) => {
                      const done = doneTypes?.has(ct);
                      return (
                        <div key={ct} className="flex items-center gap-1.5 text-xs">
                          {done ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <CircleDot className="h-3 w-3 text-muted-foreground animate-pulse" />
                          )}
                          <span className={done ? "text-foreground" : "text-muted-foreground"}>
                            {CONTENT_TYPE_LABELS[ct]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status + primary action */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className={`${status.className} text-xs gap-1`}>
                  <StatusIcon className={`h-3 w-3 ${status.animate ? "animate-spin" : ""}`} />
                  {status.label}
                </Badge>

                {sermon.is_published && (
                  <Badge variant="outline" className="text-xs gap-1 text-emerald-700 border-emerald-300">
                    <Eye className="h-3 w-3" /> Published
                  </Badge>
                )}

                {sermon.status === "review" && (
                  <Button
                    size="sm"
                    className="h-7 text-xs ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWizard(sermon.id, "review");
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Review & Approve
                  </Button>
                )}

                {sermon.status === "complete" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWizard(sermon.id, "view");
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Content
                  </Button>
                )}
              </div>
            </div>

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sermon.status === "complete" && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openWizard(sermon.id, "view"); }}>
                    <FileText className="h-4 w-4 mr-2" /> View Content
                  </DropdownMenuItem>
                )}
                {["complete", "review"].includes(sermon.status) && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePublish.mutate({ id: sermon.id, is_published: !sermon.is_published });
                    }}
                  >
                    {sermon.is_published ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Publish</>
                    )}
                  </DropdownMenuItem>
                )}
                {sermon.status === "complete" && sermon.is_published && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCurrent.mutate({ id: sermon.id, is_current: !sermon.is_current });
                    }}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    {sermon.is_current ? "Remove from Live" : "Set as Live"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: sermon.id, title: sermon.title, storagePath: sermon.storage_path });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

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
        <div className="space-y-8">
          {/* LIVE NOW */}
          {liveSermon && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live Now</h2>
              </div>
              {renderSermonCard(liveSermon, true)}
            </section>
          )}

          {/* NEEDS ATTENTION */}
          {needsAttention.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Needs Attention</h2>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">{needsAttention.length}</Badge>
              </div>
              <div className="space-y-3">
                {needsAttention.map((s) => renderSermonCard(s))}
              </div>
            </section>
          )}

          {/* PROCESSING */}
          {processing.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Processing</h2>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">{processing.length}</Badge>
              </div>
              <div className="space-y-3">
                {processing.map((s) => renderSermonCard(s))}
              </div>
            </section>
          )}

          {/* ALL SERMONS */}
          {allSermons.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">All Sermons</h2>
                <Badge variant="secondary" className="text-xs">{allSermons.length}</Badge>
              </div>
              <div className="space-y-3">
                {allSermons.map((s) => renderSermonCard(s))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sermon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title}" and all generated content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteSermon.mutate({ id: deleteTarget.id, storagePath: deleteTarget.storagePath })}
            >
              {deleteSermon.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Wizard Dialog */}
      <ReviewWizard
        sermonId={reviewSermonId}
        churchId={churchId}
        open={!!reviewSermonId}
        onClose={() => setReviewSermonId(null)}
        onApprove={(id) => approveSermon.mutate(id)}
        approving={approveSermon.isPending}
        mode={reviewMode}
      />
    </div>
  );
}

/* ─── Review Wizard Dialog ─── */

function ReviewWizard({
  sermonId,
  churchId,
  open,
  onClose,
  onApprove,
  approving,
  mode = "review",
}: {
  sermonId: string | null;
  churchId: string;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  approving: boolean;
  mode?: "review" | "view";
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [regeneratingItem, setRegeneratingItem] = useState<{ type: string; index: number } | null>(null);
  const [thumbnailSeed, setThumbnailSeed] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<number | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const currentStep = WIZARD_STEPS[step];

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setEditedContent({});
      setEditMode({});
      setRegeneratingItem(null);
      setThumbnailSeed(0);
    }
  }, [open, sermonId]);

  const { data: sermon } = useQuery({
    queryKey: ["admin", "sermon-detail", sermonId],
    enabled: !!sermonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("id", sermonId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: content, isLoading } = useQuery({
    queryKey: ["admin", "sermon-review-content", sermonId],
    enabled: !!sermonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermon_content")
        .select("content_type, content")
        .eq("sermon_id", sermonId!);
      if (error) throw error;
      return data;
    },
  });

  // Generate thumbnails
  useEffect(() => {
    if (!sermon || !open) return;
    setThumbnails([]);
    setSelectedThumb(null);

    if (sermon.source_type === "youtube" && sermon.source_url) {
      const match = sermon.source_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match?.[1]) {
        const id = match[1];
        setThumbnails([
          `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${id}/sddefault.jpg`,
          `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        ]);
      }
    } else if (sermon.source_type === "upload" && sermon.storage_path) {
      (async () => {
        try {
          const { data } = await supabase.storage
            .from("sermon-media")
            .createSignedUrl(sermon.storage_path!, 600);
          if (!data?.signedUrl) return;

          const video = document.createElement("video");
          video.crossOrigin = "anonymous";
          video.preload = "auto";
          video.muted = true;
          video.src = data.signedUrl;

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject();
          });

          const dur = video.duration;
          // Use thumbnailSeed to generate different positions each time
          const basePositions = [0.15, 0.35, 0.55, 0.75];
          const offset = (thumbnailSeed * 0.07) % 0.12;
          const positions = basePositions.map(p => Math.min(Math.max(p + offset, 0.05), 0.95));
          const frames: string[] = [];

          for (const pos of positions) {
            video.currentTime = dur * pos;
            await new Promise<void>((resolve) => {
              video.onseeked = () => resolve();
            });
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d")?.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL("image/jpeg", 0.8));
          }
          setThumbnails(frames);
        } catch (e) {
          console.error("Failed to extract thumbnails:", e);
        }
      })();
    }
  }, [sermon, open, thumbnailSeed]);

  const contentMap = new Map<string, any>((content || []).map((c) => [c.content_type as string, c.content]));

  const getContent = (type: string) => {
    if (editedContent[type] !== undefined) return editedContent[type];
    return contentMap.get(type);
  };

  const updateContent = (type: string, newContent: any) => {
    setEditedContent((prev) => ({ ...prev, [type]: newContent }));
  };

  // Save edits to DB when moving to next step
  const saveEdits = async (type: string) => {
    if (editedContent[type] === undefined || !sermonId) return;
    try {
      await supabase
        .from("sermon_content")
        .update({ content: editedContent[type] })
        .eq("sermon_id", sermonId)
        .eq("content_type", type as any);
    } catch (e) {
      console.error("Failed to save edits:", e);
    }
  };

  const handleRegenerateItem = async (type: string, itemIndex: number) => {
    if (!sermonId) return;
    setRegeneratingItem({ type, index: itemIndex });
    try {
      const { data, error } = await supabase.functions.invoke("process-sermon", {
        body: { regenerate_type: type, sermon_id: sermonId, item_index: itemIndex },
      });
      if (error) throw error;
      if (data?.content) {
        updateContent(type, data.content);
        queryClient.invalidateQueries({ queryKey: ["admin", "sermon-review-content", sermonId] });
      }
      toast.success("Item regenerated!");
    } catch (e: any) {
      toast.error("Failed to regenerate. Please try again.");
      console.error("Regeneration error:", e);
    } finally {
      setRegeneratingItem(null);
    }
  };

  const handleRegenerateThumbnails = () => {
    setThumbnailSeed((s) => s + 1);
    setSelectedThumb(null);
  };

  const handleNext = async () => {
    // Save any current edits
    if (currentStep !== "thumbnail" && currentStep !== "confirm") {
      await saveEdits(currentStep);
    }
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleApproveWithThumb = async () => {
    if (!sermonId) return;

    if (selectedThumb !== null && thumbnails[selectedThumb]) {
      setUploadingThumb(true);
      try {
        const thumbData = thumbnails[selectedThumb];
        let thumbnailUrl = thumbData;

        if (thumbData.startsWith("data:")) {
          const blob = await (await fetch(thumbData)).blob();
          const path = `${churchId}/thumb-${sermonId}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("sermon-media")
            .upload(path, blob, { contentType: "image/jpeg", upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("sermon-media")
              .getPublicUrl(path);
            thumbnailUrl = urlData?.publicUrl || thumbData;
          }
        }

        await supabase
          .from("sermons")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", sermonId);
      } catch (e) {
        console.error("Thumbnail upload error:", e);
      } finally {
        setUploadingThumb(false);
      }
    }

    // Save any remaining edits
    for (const type of TRACKED_CONTENT_TYPES) {
      if (editedContent[type] !== undefined) {
        await saveEdits(type);
      }
    }

    onApprove(sermonId);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Progress dots */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            {WIZARD_STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i <= step && setStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-primary w-6"
                    : i < step
                    ? "bg-primary/60"
                    : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <h2 className="text-lg font-bold text-foreground text-center">
            {WIZARD_STEP_LABELS[currentStep]}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-0.5">
            Step {step + 1} of {WIZARD_STEPS.length}
          </p>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="pb-6">
              {currentStep === "thumbnail" && (
                <ThumbnailStep
                  thumbnails={thumbnails}
                  selectedThumb={selectedThumb}
                  onSelect={setSelectedThumb}
                  onRegenerate={handleRegenerateThumbnails}
                  isYoutube={sermon?.source_type === "youtube"}
                />
              )}
              {currentStep === "spark" && (
                <ContentEditStep
                  type="spark"
                  data={getContent("spark")}
                  editing={editMode.spark || false}
                  onToggleEdit={() => setEditMode((p) => ({ ...p, spark: !p.spark }))}
                  onUpdate={(d) => updateContent("spark", d)}
                  onRegenerateItem={(index) => handleRegenerateItem("spark", index)}
                  regeneratingItem={regeneratingItem?.type === "spark" ? regeneratingItem.index : null}
                />
              )}
              {currentStep === "takeaways" && (
                <ContentEditStep
                  type="takeaways"
                  data={getContent("takeaways")}
                  editing={editMode.takeaways || false}
                  onToggleEdit={() => setEditMode((p) => ({ ...p, takeaways: !p.takeaways }))}
                  onUpdate={(d) => updateContent("takeaways", d)}
                  onRegenerateItem={(index) => handleRegenerateItem("takeaways", index)}
                  regeneratingItem={regeneratingItem?.type === "takeaways" ? regeneratingItem.index : null}
                />
              )}
              {currentStep === "reflection_questions" && (
                <ContentEditStep
                  type="reflection_questions"
                  data={getContent("reflection_questions")}
                  editing={editMode.reflection_questions || false}
                  onToggleEdit={() => setEditMode((p) => ({ ...p, reflection_questions: !p.reflection_questions }))}
                  onUpdate={(d) => updateContent("reflection_questions", d)}
                  onRegenerateItem={(index) => handleRegenerateItem("reflection_questions", index)}
                  regeneratingItem={regeneratingItem?.type === "reflection_questions" ? regeneratingItem.index : null}
                />
              )}
              {currentStep === "scriptures" && (
                <ContentEditStep
                  type="scriptures"
                  data={getContent("scriptures")}
                  editing={editMode.scriptures || false}
                  onToggleEdit={() => setEditMode((p) => ({ ...p, scriptures: !p.scriptures }))}
                  onUpdate={(d) => updateContent("scriptures", d)}
                  onRegenerateItem={(index) => handleRegenerateItem("scriptures", index)}
                  regeneratingItem={regeneratingItem?.type === "scriptures" ? regeneratingItem.index : null}
                />
              )}
              {currentStep === "chapters" && (
                <ContentEditStep
                  type="chapters"
                  data={getContent("chapters")}
                  editing={editMode.chapters || false}
                  onToggleEdit={() => setEditMode((p) => ({ ...p, chapters: !p.chapters }))}
                  onUpdate={(d) => updateContent("chapters", d)}
                  onRegenerateItem={(index) => handleRegenerateItem("chapters", index)}
                  regeneratingItem={regeneratingItem?.type === "chapters" ? regeneratingItem.index : null}
                />
              )}
              {currentStep === "confirm" && (
                <ConfirmStep
                  contentMap={contentMap}
                  editedContent={editedContent}
                  sermon={sermon}
                />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t flex items-center gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <div className="flex-1" />
          {currentStep === "confirm" ? (
            mode === "review" ? (
              <Button
                disabled={approving || uploadingThumb}
                onClick={handleApproveWithThumb}
                className="gap-2"
              >
                {(approving || uploadingThumb) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve & Schedule
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  for (const type of TRACKED_CONTENT_TYPES) {
                    if (editedContent[type] !== undefined) {
                      await saveEdits(type);
                    }
                  }
                  toast.success("Changes saved");
                  onClose();
                }}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {Object.keys(editedContent).length > 0 ? "Save Changes" : "Done"}
              </Button>
            )
          ) : (
            <Button onClick={handleNext} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Wizard Step Components ─── */

function ThumbnailStep({
  thumbnails,
  selectedThumb,
  onSelect,
  onRegenerate,
  isYoutube,
}: {
  thumbnails: string[];
  selectedThumb: number | null;
  onSelect: (i: number) => void;
  onRegenerate: () => void;
  isYoutube: boolean;
}) {
  if (thumbnails.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No thumbnails available for this sermon.</p>
        <p className="text-xs text-muted-foreground mt-1">You can skip this step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Choose a thumbnail for this sermon:</p>
        {!isYoutube && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onRegenerate}>
            <RefreshCw className="h-3 w-3" />
            New Frames
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {thumbnails.map((thumb, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
              selectedThumb === i ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <img
              src={thumb}
              alt={`Thumbnail option ${i + 1}`}
              className="w-full aspect-video object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {selectedThumb === i && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentEditStep({
  type,
  data,
  editing,
  onToggleEdit,
  onUpdate,
  onRegenerateItem,
  regeneratingItem,
}: {
  type: string;
  data: any;
  editing: boolean;
  onToggleEdit: () => void;
  onUpdate: (d: any) => void;
  onRegenerateItem: (index: number) => void;
  regeneratingItem: number | null;
}) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No content generated for this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onToggleEdit}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Done Editing" : "Edit"}
        </Button>
      </div>

      {type === "spark" && <SparkEditor data={data} editing={editing} onUpdate={onUpdate} onRegenerateItem={onRegenerateItem} regeneratingItem={regeneratingItem} />}
      {type === "takeaways" && <TakeawaysEditor data={data} editing={editing} onUpdate={onUpdate} onRegenerateItem={onRegenerateItem} regeneratingItem={regeneratingItem} />}
      {type === "reflection_questions" && <ReflectionEditor data={data} editing={editing} onUpdate={onUpdate} onRegenerateItem={onRegenerateItem} regeneratingItem={regeneratingItem} />}
      {type === "scriptures" && <ScripturesEditor data={data} editing={editing} onUpdate={onUpdate} onRegenerateItem={onRegenerateItem} regeneratingItem={regeneratingItem} />}
      {type === "chapters" && <ChaptersEditor data={data} editing={editing} onUpdate={onUpdate} onRegenerateItem={onRegenerateItem} regeneratingItem={regeneratingItem} />}
    </div>
  );
}

function SparkEditor({ data, editing, onUpdate, onRegenerateItem, regeneratingItem }: { data: any; editing: boolean; onUpdate: (d: any) => void; onRegenerateItem: (index: number) => void; regeneratingItem: number | null }) {
  const sparks = data?.sparks || [{ day: "Daily", title: data?.title || "", summary: data?.summary || "" }];
  const updateSpark = (index: number, field: string, value: string) => {
    const updated = [...sparks];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ sparks: updated });
  };
  return (
    <div className="space-y-3">
      {sparks.map((spark: any, i: number) => (
        <Card key={i} className={`bg-muted/30 ${regeneratingItem === i ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs font-medium">{spark.day}</Badge>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRegenerateItem(i)} disabled={regeneratingItem !== null}>
                {regeneratingItem === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Input value={spark.title} onChange={(e) => updateSpark(i, "title", e.target.value)} placeholder="Spark title" className="text-sm" />
                <Textarea value={spark.summary} onChange={(e) => updateSpark(i, "summary", e.target.value)} placeholder="Spark summary" className="text-sm min-h-[60px]" />
              </div>
            ) : (
              <>
                <p className="font-medium text-sm text-foreground">{spark.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{spark.summary}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TakeawaysEditor({ data, editing, onUpdate, onRegenerateItem, regeneratingItem }: { data: any; editing: boolean; onUpdate: (d: any) => void; onRegenerateItem: (index: number) => void; regeneratingItem: number | null }) {
  const takeaways = data?.takeaways || [];
  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...takeaways];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ takeaways: updated });
  };
  return (
    <div className="space-y-3">
      {takeaways.map((t: any, i: number) => (
        <Card key={i} className={`bg-muted/30 ${regeneratingItem === i ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-end mb-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRegenerateItem(i)} disabled={regeneratingItem !== null}>
                {regeneratingItem === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Input value={t.title} onChange={(e) => updateItem(i, "title", e.target.value)} placeholder="Takeaway title" className="text-sm" />
                <Textarea value={t.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Takeaway description" className="text-sm min-h-[60px]" />
              </div>
            ) : (
              <>
                <p className="font-medium text-sm text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReflectionEditor({ data, editing, onUpdate, onRegenerateItem, regeneratingItem }: { data: any; editing: boolean; onUpdate: (d: any) => void; onRegenerateItem: (index: number) => void; regeneratingItem: number | null }) {
  const questions = data?.questions || [];
  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ questions: updated });
  };
  return (
    <div className="space-y-3">
      {questions.map((q: any, i: number) => (
        <Card key={i} className={`bg-muted/30 ${regeneratingItem === i ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-end mb-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRegenerateItem(i)} disabled={regeneratingItem !== null}>
                {regeneratingItem === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Textarea value={q.question} onChange={(e) => updateItem(i, "question", e.target.value)} placeholder="Question" className="text-sm min-h-[60px]" />
                <Input value={q.context} onChange={(e) => updateItem(i, "context", e.target.value)} placeholder="Context" className="text-sm" />
              </div>
            ) : (
              <>
                <p className="font-medium text-sm text-foreground">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{q.context}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScripturesEditor({ data, editing, onUpdate, onRegenerateItem, regeneratingItem }: { data: any; editing: boolean; onUpdate: (d: any) => void; onRegenerateItem: (index: number) => void; regeneratingItem: number | null }) {
  const scriptures = data?.scriptures || [];
  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...scriptures];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ scriptures: updated });
  };
  return (
    <div className="space-y-3">
      {scriptures.map((s: any, i: number) => (
        <Card key={i} className={`bg-muted/30 ${regeneratingItem === i ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-end mb-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRegenerateItem(i)} disabled={regeneratingItem !== null}>
                {regeneratingItem === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Input value={s.reference} onChange={(e) => updateItem(i, "reference", e.target.value)} placeholder="Reference (e.g. Luke 5:1-7)" className="text-sm" />
                <Input value={s.text} onChange={(e) => updateItem(i, "text", e.target.value)} placeholder="Context note" className="text-sm" />
              </div>
            ) : (
              <>
                <p className="font-medium text-sm text-foreground">{s.reference}</p>
                <p className="text-xs text-muted-foreground italic mt-0.5">{s.text}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChaptersEditor({ data, editing, onUpdate, onRegenerateItem, regeneratingItem }: { data: any; editing: boolean; onUpdate: (d: any) => void; onRegenerateItem: (index: number) => void; regeneratingItem: number | null }) {
  const chapters = data?.chapters || [];
  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ chapters: updated });
  };
  return (
    <div className="space-y-2">
      {chapters.map((c: any, i: number) => (
        <Card key={i} className={`bg-muted/30 ${regeneratingItem === i ? "opacity-60" : ""}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-end mb-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRegenerateItem(i)} disabled={regeneratingItem !== null}>
                {regeneratingItem === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={c.title} onChange={(e) => updateItem(i, "title", e.target.value)} placeholder="Chapter title" className="text-sm flex-1" />
                  <Input value={c.timestamp || ""} onChange={(e) => updateItem(i, "timestamp", e.target.value)} placeholder="0:00" className="text-sm w-20" />
                </div>
                <Textarea value={c.summary || ""} onChange={(e) => updateItem(i, "summary", e.target.value)} placeholder="Summary" className="text-sm min-h-[50px]" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-muted-foreground font-mono text-xs min-w-[2ch]">{c.order || i + 1}.</span>
                  <span className="font-medium text-sm">{c.title}</span>
                </div>
                {c.timestamp && (
                  <span className="text-xs font-mono text-primary">{c.timestamp}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConfirmStep({
  contentMap,
  editedContent,
  sermon,
}: {
  contentMap: Map<string, any>;
  editedContent: Record<string, any>;
  sermon: any;
}) {
  const getCount = (type: string): number => {
    const data = editedContent[type] ?? contentMap.get(type);
    if (!data) return 0;
    if (type === "spark") return (data.sparks || []).length || (data.title ? 1 : 0);
    if (type === "takeaways") return (data.takeaways || []).length;
    if (type === "reflection_questions") return (data.questions || []).length;
    if (type === "scriptures") return (data.scriptures || []).length;
    if (type === "chapters") return (data.chapters || []).length;
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground">Everything looks good!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review the summary below, then approve to publish.
        </p>
      </div>

      {sermon && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="font-semibold text-foreground">{sermon.title}</p>
            {sermon.speaker && <p className="text-xs text-muted-foreground mt-0.5">{sermon.speaker}</p>}
            <p className="text-xs text-muted-foreground">{format(new Date(sermon.sermon_date), "MMM d, yyyy")}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {TRACKED_CONTENT_TYPES.map((ct) => {
          const count = getCount(ct);
          return (
            <div key={ct} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-foreground">{CONTENT_TYPE_LABELS[ct]}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Upload Form ─── */

type UploadStep = "idle" | "uploading" | "finalizing" | "done";

const uploadMessages: Record<string, string[]> = {
  uploading: [
    "Sending your sermon to the cloud ☁️",
    "Your sermon is on its way… 🚀",
    "Hang tight, good things take a moment ✨",
    "Almost there! 🙌",
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
        setUploadStep("uploading");
        setUploadPercent(0);
        setFriendlyMessage(getUploadMessage("uploading", 0));

        const timestamp = Date.now();
        const safeFileName = file.name
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "_");
        const storageFileName = `${timestamp}-${safeFileName}`;
        const storagePath = `${churchId}/${storageFileName}`;
        const encodedStoragePath = `${encodeURIComponent(churchId)}/${encodeURIComponent(storageFileName)}`;

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

          xhr.open("POST", `${supabaseUrl}/storage/v1/object/sermon-media/${encodedStoragePath}`);
          xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
          xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
          xhr.setRequestHeader("x-upsert", "false");
          xhr.send(file);
        });

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
