import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Loader2, MoreHorizontal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import CommunityGuidelinesDialog from "./CommunityGuidelinesDialog";
import ReportBlockSheet from "./ReportBlockSheet";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { useCommunityGuidelines } from "@/hooks/useCommunityGuidelines";
import { useAccentColors } from "./themeColors";
import { getAvatarColor } from "./avatarColors";
import { DEMO_GROUP_MESSAGES } from "./demoData";

interface GroupChatProps {
  groupId: string;
  isMember: boolean;
  isDemo?: boolean;
  churchId?: string;
  onViewProfile?: (userId: string) => void;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: { first_name: string; last_name: string; avatar_url: string | null };
}

export default function GroupChat({ groupId, isMember, isDemo, churchId, onViewProfile }: GroupChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colors = useAccentColors();
  const [text, setText] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const { accepted: guidelinesAccepted, accept: acceptGuidelines } = useCommunityGuidelines();
  const [reportTarget, setReportTarget] = useState<Message | null>(null);
  const { blockedIds } = useBlockedUsers();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const mouseStartRef = useRef({ x: 0, dragging: false });

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  // Native (non-passive) touch listeners so we can preventDefault on horizontal swipes
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    let startX = 0, startY = 0;
    let direction: "undecided" | "horizontal" | "vertical" = "undecided";

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      direction = "undecided";
      setIsAnimating(false);
    };
    const onMove = (e: TouchEvent) => {
      const dx = startX - e.touches[0].clientX;
      const dy = e.touches[0].clientY - startY;
      if (direction === "undecided") {
        if (Math.abs(dx) > Math.abs(dy) + 4) direction = "horizontal";
        else if (Math.abs(dy) > Math.abs(dx) + 4) direction = "vertical";
      }
      if (direction === "horizontal") {
        e.preventDefault();
        setSwipeX(Math.max(0, Math.min(dx, 70)));
      }
    };
    const onEnd = () => {
      direction = "undecided";
      setIsAnimating(true);
      setSwipeX(0);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, dragging: true };
    setIsAnimating(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseStartRef.current.dragging) return;
    const dx = mouseStartRef.current.x - e.clientX;
    setSwipeX(Math.max(0, Math.min(dx, 70)));
  };
  const handleMouseUp = () => {
    mouseStartRef.current.dragging = false;
    setIsAnimating(true);
    setSwipeX(0);
  };

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

  // Check acknowledgement — use persistent local + DB
  const { data: hasAcknowledged } = useQuery({
    queryKey: ["chat-ack", user?.id],
    queryFn: async () => {
      if (guidelinesAccepted) return true;
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

    if (!hasAcknowledged && !guidelinesAccepted) {
      setPendingMessage(msg);
      setShowGuidelines(true);
      return;
    }

    sendMutation.mutate(msg);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, user, hasAcknowledged, guidelinesAccepted, sendMutation]);

  const handleGuidelinesAccept = async () => {
    acceptGuidelines();
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

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatDayLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfMsg.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const groupedMessages = useMemo(() => {
    const groups: { dayKey: string; label: string; messages: typeof displayMessages }[] = [];
    displayMessages.forEach((msg) => {
      const d = new Date(msg.created_at);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groups.length || groups[groups.length - 1].dayKey !== dayKey) {
        groups.push({ dayKey, label: formatDayLabel(msg.created_at), messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [displayMessages]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col"
      style={{
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Messages */}
      <div
        ref={messagesScrollRef}
        className="flex-1 px-4 py-3"
        style={{ overflowY: "auto", overflowX: "clip", minHeight: 0, WebkitOverflowScrolling: "touch" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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

        {groupedMessages.map((group) => (
          <div key={group.dayKey} className="space-y-3">
            {/* Day separator */}
            <div className="flex justify-center py-1 pt-3 first:pt-1">
              <span className="text-[11px] text-muted-foreground/60 font-medium">{group.label}</span>
            </div>

            {group.messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 group relative ${isMe ? "flex-row-reverse" : ""}`}
                  style={{
                    transform: `translateX(-${swipeX}px)`,
                    transition: isAnimating ? "transform 0.25s ease-out" : "none",
                  }}
                >
                  {/* Avatar */}
                  <button
                    className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: msg.sender?.avatar_url ? "hsl(var(--muted))" : getAvatarColor(msg.sender?.first_name || "U") }}
                    onClick={() => !isMe && onViewProfile?.(msg.user_id)}
                    disabled={isMe || !onViewProfile}
                  >
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">
                        {msg.sender?.first_name?.[0]}{msg.sender?.last_name?.[0]}
                      </span>
                    )}
                  </button>

                  {/* Bubble */}
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    {!isMe && (
                      <button
                        className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-1 text-left"
                        onClick={() => onViewProfile?.(msg.user_id)}
                        disabled={!onViewProfile}
                      >
                        {msg.sender?.first_name}
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      {isMe && <div className="w-5" />}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isMe ? "rounded-br-md text-white" : "bg-card shadow-card rounded-bl-md text-foreground"
                        }`}
                        style={isMe ? { background: colors.accent } : undefined}
                      >
                        {msg.content}
                      </div>
                      {!isMe && (
                        <button
                          onClick={() => setReportTarget(msg)}
                          className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 tap-active shrink-0"
                          onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        >
                          <MoreHorizontal size={13} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Swipe-reveal timestamp */}
                  <span
                    className="absolute text-[10px] text-muted-foreground/70 whitespace-nowrap"
                    style={{ right: -72, top: "50%", transform: "translateY(-50%)" }}
                  >
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 flex gap-2 items-end" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          onBlur={() => { setTimeout(() => window.scrollTo(0, 0), 50); }}
          placeholder="Type a message..."
          className="flex-1 bg-card rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none overflow-hidden"
          style={{ lineHeight: "1.4", maxHeight: "120px", overflowY: "auto" }}
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
          churchId={churchId}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}
