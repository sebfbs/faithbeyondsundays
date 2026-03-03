import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, MoreHorizontal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import CommunityGuidelinesDialog from "./CommunityGuidelinesDialog";
import ReportBlockSheet from "./ReportBlockSheet";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { getAccentColors } from "./themeColors";
import { getAvatarColor } from "./avatarColors";
import { DEMO_GROUP_MESSAGES } from "./demoData";

interface GroupChatProps {
  groupId: string;
  isMember: boolean;
  isDemo?: boolean;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: { first_name: string; last_name: string; avatar_url: string | null };
}

export default function GroupChat({ groupId, isMember, isDemo }: GroupChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colors = getAccentColors();
  const [text, setText] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [reportTarget, setReportTarget] = useState<Message | null>(null);
  const { blockedIds } = useBlockedUsers();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Track visual viewport to handle iOS keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      setViewportHeight(vv.height);
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_messages" as any)
        .select("id, user_id, content, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;

      // Fetch sender profiles
      const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles_safe")
            .select("user_id, first_name, last_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      return (data || []).map((m: any) => ({
        ...m,
        sender: profileMap.get(m.user_id) || {
          first_name: "User",
          last_name: "",
          avatar_url: null,
        },
      })) as Message[];
    },
    enabled: isMember && !isDemo,
  });

  const demoMessages = isDemo ? (DEMO_GROUP_MESSAGES[groupId] || []) : [];
  const allMessages = isDemo ? demoMessages : messages;
  const displayMessages = allMessages.filter((m) => !blockedIds.includes(m.user_id));

  // Realtime subscription
  useEffect(() => {
    if (!isMember || isDemo) return;
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, isMember, queryClient]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check acknowledgement
  const { data: hasAcknowledged } = useQuery({
    queryKey: ["chat-ack", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("group_chat_acknowledgements" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!user && isMember,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("group_messages" as any)
        .insert({ group_id: groupId, user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
      // Update last-read timestamp
      localStorage.setItem(`group-chat-read-${groupId}`, new Date().toISOString());
    },
  });

  const handleSend = useCallback(() => {
    const msg = text.trim();
    if (!msg || !user) return;

    if (!hasAcknowledged) {
      setPendingMessage(msg);
      setShowGuidelines(true);
      return;
    }

    sendMutation.mutate(msg);
    setText("");
  }, [text, user, hasAcknowledged, sendMutation]);

  const handleGuidelinesAccept = async () => {
    await supabase
      .from("group_chat_acknowledgements" as any)
      .insert({ user_id: user!.id });
    queryClient.invalidateQueries({ queryKey: ["chat-ack", user?.id] });
    setShowGuidelines(false);
    if (pendingMessage) {
      sendMutation.mutate(pendingMessage);
      setPendingMessage("");
      setText("");
    }
  };

  // Mark as read on mount
  useEffect(() => {
    if (isMember) {
      localStorage.setItem(`group-chat-read-${groupId}`, new Date().toISOString());
    }
  }, [groupId, isMember]);

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-sm text-muted-foreground">
          Join this group to start chatting with other members.
        </p>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Messages */}
      <div className="flex-1 px-4 py-3 space-y-3" style={{ overflowY: "auto", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && displayMessages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No messages yet — start the conversation!
          </p>
        )}
        {displayMessages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: msg.sender?.avatar_url ? "hsl(var(--muted))" : getAvatarColor(msg.sender?.first_name || "U") }}
              >
                {msg.sender?.avatar_url ? (
                  <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-white">
                    {msg.sender?.first_name?.[0]}{msg.sender?.last_name?.[0]}
                  </span>
                )}
              </div>
              {/* Bubble */}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-1">
                    {msg.sender?.first_name}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  {isMe && (
                    <div className="w-5" /> 
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      isMe
                        ? "rounded-br-md text-white"
                        : "bg-card shadow-card rounded-bl-md text-foreground"
                    }`}
                    style={isMe ? { background: colors.accent } : undefined}
                  >
                    {msg.content}
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => setReportTarget(msg)}
                      className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 tap-active shrink-0"
                      style={{ opacity: undefined }}
                      onPointerDown={(e) => {
                        // Make visible on tap for mobile
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                      }}
                    >
                      <MoreHorizontal size={13} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 flex gap-2 items-end" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          onBlur={() => {
            // Fix iOS gap after keyboard dismissal
            setTimeout(() => window.scrollTo(0, 0), 50);
          }}
          placeholder="Type a message..."
          className="flex-1 bg-card rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: colors.accent }}
        >
          {sendMutation.isPending ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>

      <CommunityGuidelinesDialog
        open={showGuidelines}
        onAccept={handleGuidelinesAccept}
      />

      {reportTarget && (
        <ReportBlockSheet
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.user_id}
          reportedUserName={reportTarget.sender?.first_name || "User"}
          contentType="group_message"
          contentId={reportTarget.id}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}
