import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, FlaskConical, RotateCcw } from "lucide-react";

type ContentType = "spark" | "reflection_questions" | "takeaways" | "scriptures" | "chapters";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ConvMessage {
  role: "user" | "assistant";
  content: string;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "spark", label: "Sparks" },
  { value: "reflection_questions", label: "Reflections" },
  { value: "takeaways", label: "Takeaways" },
  { value: "scriptures", label: "Scriptures" },
  { value: "chapters", label: "Chapters" },
];

const DEFAULT_PROMPTS: Record<ContentType, string> = {
  spark: `Generate 7 "Daily Sparks" — one for each day of the week (Monday through Sunday). Each spark should have:
- A catchy, unique title
- A 1-2 sentence short summary that applies the sermon's core spiritual message to that day

Each spark should feel fresh and offer a different angle or application of the sermon's biblical truths. Monday might focus on starting the week with purpose, Sunday on worship and gratitude. Focus only on spiritual, biblical, and faith-based content. Ignore any logistical announcements or church business.`,

  reflection_questions: `Generate exactly 7 reflection questions — one for each day of the week (Monday through Sunday). Each question should:
- Be written in SECOND PERSON ("you", "your") — NEVER first person ("I", "my")
- Feel standalone and personal, as if a wise pastor is asking the reader directly
- NEVER reference "the sermon", "the preacher", the speaker, or any meta-framing like "the message emphasizes"
- Explore a different angle of the sermon's spiritual truths each day
- Help the reader examine their faith and relationship with God

Each question needs a "day" field and brief spiritual context (also in second person). Focus only on spiritual, biblical, and faith-based content. Ignore any logistical announcements or church business.`,

  takeaways: `Extract 3-5 key SPIRITUAL takeaways from this sermon. Each should have a clear title and a 1-2 sentence description. Focus EXCLUSIVELY on:
- Biblical truths and principles
- Faith-based insights and spiritual growth points
- Actionable spiritual truths that listeners can apply to their walk with God

IGNORE completely:
- Church logistics (building, location, lease, finances)
- Administrative announcements
- Event promotions or scheduling
- Any non-spiritual content`,

  scriptures: `Identify only the scripture passages that were directly quoted or explicitly discussed by the pastor. Rules:

1. A passage qualifies only if the pastor reads it word for word OR references the specific verse number by name AND spends time explaining its meaning.
2. Group consecutive verses from the same chapter into one reference (e.g. Acts 3:1-10, not Acts 3:1, Acts 3:6 separately).
3. Do NOT include passing mentions — any biblical reference under 2 sentences without a verse citation.
4. Do NOT include loose references or implied allusions to scripture.
5. Do NOT list the same passage more than once.
6. Return no more than 5 references unless the pastor explicitly cited more.
7. For each: book, chapter and verse range, and one sentence describing how it was used.`,

  chapters: `Identify the main structural chapters of this sermon. Include:
- The introduction
- Scripture reading(s)
- Each main point
- Any major illustrative stories
- The closing prayer or altar call

Do NOT include sub-points, illustrations, or transitions as their own chapters.

For each chapter:
- Clear, descriptive title
- 1-2 sentence summary
- Order number (1, 2, 3...)
- Timestamp from the timing markers already in the transcript [e.g. 5:23]

Rules:
- Keep total chapters between 6 and 10
- First chapter MUST use timestamp 0:00
- Last chapter MUST be from the final third of the sermon
- Chapters MUST span the ENTIRE sermon — do not cluster in the first half
- Only use timestamps that appear in the transcript`,
};

function OutputPanel({ contentType, content }: { contentType: ContentType; content: any }) {
  if (contentType === "spark" && content.sparks) {
    return (
      <div className="space-y-3">
        {content.sparks.map((s: any, i: number) => (
          <div key={i} className="border rounded-lg p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.day}</span>
            <p className="font-semibold text-sm mt-1">{s.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.summary}</p>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "reflection_questions" && content.questions) {
    return (
      <div className="space-y-3">
        {content.questions.map((q: any, i: number) => (
          <div key={i} className="border rounded-lg p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{q.day}</span>
            <p className="font-semibold text-sm mt-1">{q.question}</p>
            <p className="text-sm text-muted-foreground mt-1 italic">{q.context}</p>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "takeaways" && content.takeaways) {
    return (
      <div className="space-y-3">
        {content.takeaways.map((t: any, i: number) => (
          <div key={i} className="border rounded-lg p-3">
            <p className="font-semibold text-sm">{t.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "scriptures" && content.scriptures) {
    return (
      <div className="space-y-3">
        {content.scriptures.map((s: any, i: number) => (
          <div key={i} className="border rounded-lg p-3">
            <p className="font-semibold text-sm">{s.reference}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
          </div>
        ))}
      </div>
    );
  }

  if (contentType === "chapters" && content.chapters) {
    return (
      <div className="space-y-3">
        {content.chapters.map((c: any, i: number) => (
          <div key={i} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{c.timestamp}</span>
              <span className="text-xs text-muted-foreground">Ch. {c.order}</span>
            </div>
            <p className="font-semibold text-sm">{c.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.summary}</p>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">No output to display.</p>;
}

export default function AdminPromptLab() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const { toast } = useToast();

  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("spark");
  const [promptInstructions, setPromptInstructions] = useState(DEFAULT_PROMPTS.spark);
  const [output, setOutput] = useState<any>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const { data: sermons, isLoading: sermonsLoading } = useQuery({
    queryKey: ["prompt-lab-sermons", churchId],
    enabled: !!churchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("id, title")
        .eq("church_id", churchId)
        .eq("status", "review")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; title: string }[];
    },
  });

  function handleContentTypeChange(val: string) {
    const ct = val as ContentType;
    setContentType(ct);
    setPromptInstructions(DEFAULT_PROMPTS[ct]);
    resetOutput();
  }

  function handleSermonChange(val: string) {
    setSelectedSermonId(val);
    resetOutput();
  }

  function resetOutput() {
    setOutput(null);
    setConvMessages([]);
    setChatHistory([]);
    setChatInput("");
  }

  async function handleGenerate() {
    if (!selectedSermonId || generating) return;
    setGenerating(true);
    resetOutput();

    try {
      const { data, error } = await supabase.functions.invoke("prompt-lab", {
        body: {
          mode: "generate",
          sermon_id: selectedSermonId,
          content_type: contentType,
          prompt_instructions: promptInstructions,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOutput(data.content);
      setConvMessages(data.messages);
    } catch (e: any) {
      const isApiDown = e.message?.includes("non-2xx") || e.message?.includes("500");
      toast({
        title: "Generation failed",
        description: isApiDown
          ? "Claude API may be experiencing issues. Try again in a few minutes."
          : e.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading || convMessages.length === 0) return;

    setChatInput("");
    setChatLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);

    try {
      const { data, error } = await supabase.functions.invoke("prompt-lab", {
        body: {
          mode: "chat",
          messages: convMessages,
          new_message: msg,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConvMessages(data.messages);
      setChatHistory((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e: any) {
      toast({ title: "Chat failed", description: e.message || "Unknown error", variant: "destructive" });
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  }

  const noTranscribedSermons = !sermonsLoading && (sermons ?? []).length === 0;

  return (
    <div className="p-6 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Prompt Lab</h1>
          <p className="text-sm text-muted-foreground">Test and refine AI prompts without re-uploading a sermon</p>
        </div>
      </div>

      {noTranscribedSermons ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <FlaskConical className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-medium">No transcribed sermons yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload and process a sermon first, then come back here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[2fr_3fr] gap-6 flex-1 min-h-0">

          {/* ── Left: Config ── */}
          <div className="flex flex-col gap-4 min-h-0">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sermon</label>
              <Select value={selectedSermonId} onValueChange={handleSermonChange} disabled={sermonsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={sermonsLoading ? "Loading…" : "Select a sermon"} />
                </SelectTrigger>
                <SelectContent>
                  {(sermons ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title || "Untitled sermon"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Content type</label>
              <Tabs value={contentType} onValueChange={handleContentTypeChange}>
                <TabsList className="w-full">
                  {CONTENT_TYPES.map((ct) => (
                    <TabsTrigger key={ct.value} value={ct.value} className="flex-1 text-xs px-1">
                      {ct.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Prompt instructions</label>
                <button
                  onClick={() => setPromptInstructions(DEFAULT_PROMPTS[contentType])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <Textarea
                value={promptInstructions}
                onChange={(e) => setPromptInstructions(e.target.value)}
                className="flex-1 font-mono text-xs resize-none"
                placeholder="Enter prompt instructions…"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedSermonId || generating}
              className="shrink-0"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                : "Generate"}
            </Button>
          </div>

          {/* ── Right: Output + Chat ── */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Output panel */}
            <div className="flex-1 overflow-y-auto border rounded-lg p-4 min-h-0">
              {generating ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Asking Claude…</span>
                </div>
              ) : output ? (
                <OutputPanel contentType={contentType} content={output} />
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FlaskConical className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a sermon and hit Generate.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Edit the prompt on the left to experiment.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat — appears after first generation */}
            {output && (
              <div className="shrink-0 border rounded-lg flex flex-col" style={{ maxHeight: "280px" }}>
                {/* Message history */}
                {chatHistory.length > 0 && (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Input row */}
                <div className="p-3 flex flex-col gap-2 border-t">
                  {chatHistory.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Chat with Claude to refine the output above
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleChat();
                        }
                      }}
                      placeholder='e.g. "make the sparks shorter", "try a more poetic tone"'
                      className="flex-1 text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={chatLoading}
                    />
                    <Button
                      size="icon"
                      onClick={handleChat}
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      {chatLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
