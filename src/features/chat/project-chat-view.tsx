"use client";

import * as React from "react";
import {
  Send,
  Reply,
  X,
  MessageSquare,
  AtSign,
  Trash2,
  Pin,
  Smile,
  ExternalLink,
  CornerDownRight,
} from "lucide-react";
import Link from "next/link";
import {
  sendProjectMessageAction,
  deleteProjectMessageAction,
  togglePinProjectMessageAction,
} from "./actions";

export interface ChatUser {
  id: string;
  name: string;
  employeeId: string;
  position: string | null;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
  user: ChatUser;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      employeeId: string;
    };
  } | null;
  mentions: string[];
}

export interface MemberOption {
  id: string;
  name: string;
  employeeId: string;
  position: string | null;
}

interface ProjectChatViewProps {
  projectId: string;
  projectName: string;
  projectCode: string;
  currentUserId: string;
  isLeadOrAdmin: boolean;
  initialMessages: ChatMessage[];
  members: MemberOption[];
}

export function ProjectChatView({
  projectId,
  projectName,
  projectCode,
  currentUserId,
  isLeadOrAdmin,
  initialMessages,
  members,
}: ProjectChatViewProps) {
  const [messages, setMessages] =
    React.useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState<ChatMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showMentionMenu, setShowMentionMenu] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [highlightedMentionIndex, setHighlightedMentionIndex] =
    React.useState(0);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    [],
  );

  React.useEffect(() => {
    scrollToBottom("auto");
  }, [scrollToBottom]);

  // Filter members for @mention dropdown
  const filteredMembers = React.useMemo(() => {
    if (!showMentionMenu) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q)),
    );
  }, [members, showMentionMenu, mentionQuery]);

  // Handle textarea change and detect @
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt =
        lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      const query = textBeforeCursor.slice(lastAtIndex + 1);

      // Only trigger if @ is at start of line or preceded by whitespace, and query has no spaces
      if (
        (charBeforeAt === " " || charBeforeAt === "\n") &&
        !query.includes(" ")
      ) {
        setShowMentionMenu(true);
        setMentionQuery(query);
        setHighlightedMentionIndex(0);
        return;
      }
    }

    setShowMentionMenu(false);
  };

  const insertMention = (member: MemberOption) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = inputText.slice(0, cursorPos);
    const textAfterCursor = inputText.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const prefix = textBeforeCursor.slice(0, lastAtIndex);
      const newText = `${prefix}@${member.name} ${textAfterCursor}`;
      setInputText(newText);
      setShowMentionMenu(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const nextPos = prefix.length + member.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedMentionIndex(
          (prev) => (prev + 1) % filteredMembers.length,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedMentionIndex(
          (prev) =>
            (prev - 1 + filteredMembers.length) % filteredMembers.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredMembers[highlightedMentionIndex];
        if (selected) {
          insertMention(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    // Submit on Enter without shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const replyId = replyingTo?.id;

    // Detect mentioned users
    const mentionedIds = members
      .filter(
        (m) =>
          trimmed.includes(`@${m.name}`) ||
          trimmed.includes(`@${m.employeeId}`),
      )
      .map((m) => m.id);

    const res = await sendProjectMessageAction({
      projectId,
      content: trimmed,
      replyToId: replyId,
      mentionedUserIds: mentionedIds,
    });

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message as unknown as ChatMessage]);
      setInputText("");
      setReplyingTo(null);
      setShowMentionMenu(false);
      setTimeout(() => scrollToBottom("smooth"), 50);
    } else {
      alert(res.error || "Failed to send message");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await deleteProjectMessageAction(projectId, messageId);
  };

  const handleTogglePin = async (messageId: string) => {
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m,
      ),
    );
    await togglePinProjectMessageAction(projectId, messageId);
  };

  const scrollToQuotedMessage = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/10", "ring-2", "ring-primary/40");
      setTimeout(() => {
        el.classList.remove("bg-primary/10", "ring-2", "ring-primary/40");
      }, 1500);
    }
  };

  // Helper to get initials
  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  // Helper to format content with clickable mentions and task codes
  const renderFormattedContent = (content: string) => {
    // Regex for @mentions or task code patterns e.g. [DF-PRJ-T-001] or DF-PRJ-T-001
    const parts = content.split(
      /(@[a-zA-Z0-9_\s]{2,25}|(?:\[?[A-Z0-9]+-T-[0-9]{3,}\]?))/g,
    );

    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const cleanName = part.substring(1).trim();
        const matched = members.find(
          (m) =>
            m.name.toLowerCase() === cleanName.toLowerCase() ||
            m.employeeId.toLowerCase() === cleanName.toLowerCase(),
        );
        return (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 text-[11px] font-semibold bg-[#EFF8FF] text-[#175CD3] rounded border border-[#B2DDFF]"
          >
            <AtSign className="size-3 text-[#2563EB]" />
            {matched ? matched.name : cleanName}
          </span>
        );
      }

      // Check task code
      const taskCodeMatch = part.match(/\[?([A-Z0-9]+-T-[0-9]{3,})\]?/);
      if (taskCodeMatch) {
        const code = taskCodeMatch[1];
        return (
          <Link
            key={i}
            href={`/projects/${projectId}/tasks?search=${code}`}
            className="inline-flex items-center gap-1 font-semibold text-primary bg-[#EEF4FF] hover:bg-[#E0EAFF] px-1.5 py-0.5 rounded text-[11px] mx-0.5 border border-[#C7D7FE] transition-colors"
          >
            <span>{code}</span>
            <ExternalLink className="size-2.5 opacity-60" />
          </Link>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] min-h-[550px] bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAECF0] bg-[#FAFAFC]">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-[#EEF4FF] text-primary flex items-center justify-center font-bold">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-foreground">
                {projectName} Discussion
              </h2>
              <span className="text-[11px] font-mono px-1.5 py-0.5 bg-surface-hover text-text-secondary rounded font-medium">
                {projectCode}
              </span>
            </div>
            <p className="text-[12px] text-text-muted">
              Real-time project progress, blockers, and team thread •{" "}
              {members.length} team members
            </p>
          </div>
        </div>

        {pinnedMessages.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#344054] bg-surface px-3 py-1.5 rounded-lg border border-[#EAECF0]">
            <Pin className="size-3.5 text-[#F79009] fill-[#F79009]" />
            <span className="font-semibold">
              {pinnedMessages.length} Pinned
            </span>
          </div>
        )}
      </div>

      {/* Pinned Messages Bar (if any) */}
      {(() => {
        const latestPinned = pinnedMessages[pinnedMessages.length - 1];
        if (!latestPinned) return null;
        return (
          <div className="bg-[#FFFAEB] border-b border-[#FEDF89] px-5 py-2 flex items-center justify-between text-[12px] text-[#B54708]">
            <div className="flex items-center gap-2 truncate">
              <Pin className="size-3.5 shrink-0" />
              <span className="font-semibold shrink-0">Pinned note:</span>
              <span className="truncate italic">“{latestPinned.content}”</span>
            </div>
            <button
              onClick={() => scrollToQuotedMessage(latestPinned.id)}
              className="text-[11px] font-bold text-[#B54708] hover:underline shrink-0 ml-2"
            >
              Jump
            </button>
          </div>
        );
      })()}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F9FC]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="size-14 rounded-2xl bg-[#EEF4FF] text-primary flex items-center justify-center mb-3">
              <MessageSquare className="size-7" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">
              No discussion messages yet
            </h3>
            <p className="text-[12px] text-text-muted max-w-sm mt-1">
              Start discussing deliverables, assign milestones, or mention
              colleagues with{" "}
              <span className="font-semibold text-primary">@name</span>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const canManageMsg = isMe || isLeadOrAdmin;

            return (
              <div
                key={msg.id}
                ref={(el) => {
                  messageRefs.current[msg.id] = el;
                }}
                className={`group flex items-start gap-3 transition-all rounded-lg p-1.5 ${
                  isMe ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
                    isMe
                      ? "bg-primary text-white border-[#4C50D8]"
                      : "bg-surface-hover text-[#344054] border-[#EAECF0]"
                  }`}
                >
                  {getInitials(msg.user.name)}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}
                >
                  {/* Meta: Author & Time */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[12px] font-bold text-foreground">
                      {isMe ? "You" : msg.user.name}
                    </span>
                    {msg.user.position && (
                      <span className="text-[10px] text-text-muted hidden sm:inline">
                        • {msg.user.position}
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">
                      {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.isPinned && (
                      <Pin className="size-3 text-[#F79009] fill-[#F79009]" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-[13px] leading-relaxed transition-all ${
                      isMe
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-white text-foreground border border-border rounded-tl-none"
                    }`}
                  >
                    {/* WhatsApp-Style Quote Reply Header */}
                    {msg.replyTo && (
                      <div
                        onClick={() => scrollToQuotedMessage(msg.replyTo!.id)}
                        className={`mb-2 pl-2.5 py-1 pr-2 rounded cursor-pointer border-l-4 text-[12px] transition-opacity hover:opacity-85 ${
                          isMe
                            ? "bg-[#4C50D8] border-white/80 text-white/90"
                            : "bg-background border-primary text-[#344054]"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-semibold text-[11px] opacity-90">
                          <CornerDownRight className="size-3" />
                          <span>{msg.replyTo.user.name}</span>
                        </div>
                        <p className="line-clamp-1 italic text-[11px] opacity-80 mt-0.5">
                          {msg.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Content */}
                    <div className="whitespace-pre-wrap break-words">
                      {renderFormattedContent(msg.content)}
                    </div>

                    {/* Action Bar On Hover */}
                    <div
                      className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-border rounded-lg shadow-sm px-1.5 py-0.5 -mt-3.5 z-10 ${
                        isMe ? "right-0" : "left-0"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          textareaRef.current?.focus();
                        }}
                        className="p-1 text-text-muted hover:text-primary hover:bg-[#EEF4FF] rounded transition-colors"
                        title="Quote Reply"
                      >
                        <Reply className="size-3.5" />
                      </button>

                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 rounded transition-colors ${
                          msg.isPinned
                            ? "text-[#F79009] bg-[#FFFAEB]"
                            : "text-text-muted hover:text-[#F79009] hover:bg-[#FFFAEB]"
                        }`}
                        title={msg.isPinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin className="size-3.5" />
                      </button>

                      {canManageMsg && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 text-text-muted hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Auto-complete Menu */}
      {showMentionMenu && filteredMembers.length > 0 && (
        <div className="bg-surface border-t border-x border-border shadow-lg max-h-48 overflow-y-auto px-1 py-1 divide-y divide-[#F2F4F7]">
          <div className="text-[10px] font-bold text-text-muted uppercase px-3 py-1">
            Mention Member (Enter to select)
          </div>
          {filteredMembers.map((member, idx) => (
            <button
              key={member.id}
              onClick={() => insertMention(member)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left rounded text-[12px] transition-colors ${
                idx === highlightedMentionIndex
                  ? "bg-[#EEF4FF] text-[#175CD3]"
                  : "hover:bg-background text-[#344054]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-full bg-[#EAECF0] text-[#344054] text-[9px] font-bold flex items-center justify-center">
                  {getInitials(member.name)}
                </div>
                <span className="font-semibold">{member.name}</span>
                <span className="text-[10px] text-text-muted">
                  ({member.employeeId})
                </span>
              </div>
              {member.position && (
                <span className="text-[11px] text-text-muted">
                  {member.position}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Quote Staging Bar */}
      {replyingTo && (
        <div className="bg-[#F8F9FC] border-t border-[#EAECF0] px-4 py-2 flex items-center justify-between">
          <div className="flex items-start gap-2.5 border-l-4 border-primary pl-3 py-0.5 min-w-0">
            <div>
              <div className="text-[11px] font-bold text-primary flex items-center gap-1">
                <Reply className="size-3" />
                Replying to {replyingTo.user.name}
              </div>
              <p className="text-[12px] text-text-secondary line-clamp-1 italic">
                “{replyingTo.content}”
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded text-text-muted hover:text-text-secondary hover:bg-[#EAECF0] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3.5 bg-surface border-t border-[#EAECF0]">
        <div className="relative flex items-center gap-2">
          <div className="flex-1 relative bg-[#F8F9FC] border border-border-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-xl transition-all">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${projectCode} (Type @ to mention, Enter to send)...`}
              rows={1}
              className="w-full bg-transparent px-4 py-2.5 text-[13px] text-foreground placeholder-[#98A2B3] focus:outline-none resize-none max-h-32 min-h-[42px]"
            />
            <div className="flex items-center justify-between px-3 pb-1.5 text-[11px] text-text-muted">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setInputText((prev) => `${prev}@`);
                    setShowMentionMenu(true);
                    setMentionQuery("");
                    textareaRef.current?.focus();
                  }}
                  className="hover:text-primary hover:bg-[#EEF4FF] p-1 rounded transition-colors flex items-center gap-0.5 font-medium"
                >
                  <AtSign className="size-3" /> Mention
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputText((prev) => `${prev} 👍 `);
                    textareaRef.current?.focus();
                  }}
                  className="hover:text-primary hover:bg-[#EEF4FF] p-1 rounded transition-colors flex items-center gap-0.5"
                >
                  <Smile className="size-3" />
                </button>
              </div>
              <span className="hidden sm:inline">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!inputText.trim() || isSubmitting}
            onClick={handleSubmit}
            className="size-10 rounded-xl bg-primary hover:bg-primary-hover active:bg-[#3E42C2] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
