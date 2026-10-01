"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Reply,
  X,
  AtSign,
  Trash2,
  Pin,
  Smile,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import {
  sendProjectMessageAction,
  deleteProjectMessageAction,
  togglePinProjectMessageAction,
} from "./actions";

export interface ProjectGroupMember {
  id: string;
  name: string;
  employeeId: string;
  position: string | null;
  projectRole: string;
  isLead: boolean;
  avatarUrl?: string | null;
}

export interface ProjectGroup {
  id: string;
  name: string;
  projectCode: string;
  status: string;
  projectLeadId: string | null;
  members: ProjectGroupMember[];
  lastMessage?: {
    content: string;
    createdAt: string | Date;
    senderName: string;
  } | null;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    employeeId: string;
    position: string | null;
    avatarUrl: string | null;
  };
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

interface WorkspaceChatViewProps {
  projects: ProjectGroup[];
  activeProjectId: string;
  currentUserId: string;
  isAdmin: boolean;
  initialMessages: ChatMessage[];
}

export function WorkspaceChatView({
  projects,
  activeProjectId: initialActiveProjectId,
  currentUserId,
  isAdmin,
  initialMessages,
}: WorkspaceChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeProjectId, setActiveProjectId] = useState<string>(
    initialActiveProjectId || (projects[0]?.id ?? ""),
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync active project if search param changes
  useEffect(() => {
    const pParam = searchParams.get("project");
    if (pParam && pParam !== activeProjectId) {
      const exists = projects.some((p) => p.id === pParam);
      if (exists) {
        setActiveProjectId(pParam);
      }
    }
  }, [searchParams, projects, activeProjectId]);

  // Sync initial messages when active project changes from parent
  useEffect(() => {
    setMessages(initialMessages);
    setReplyingTo(null);
    setInputText("");
  }, [initialActiveProjectId, initialMessages]);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  const isLeadOrAdmin = useMemo(() => {
    if (!activeProject) return false;
    return isAdmin || activeProject.projectLeadId === currentUserId;
  }, [activeProject, isAdmin, currentUserId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("auto");
  }, [activeProjectId, scrollToBottom]);

  // Filter project groups in left sidebar
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.members.some((m) => m.name.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  // Handle channel click
  const selectChannel = (projId: string) => {
    if (projId === activeProjectId) return;
    setActiveProjectId(projId);
    router.push(`/chat?project=${projId}`);
  };

  // Mention filtering
  const filteredMembers = useMemo(() => {
    if (!activeProject || !showMentionMenu) return [];
    const q = mentionQuery.toLowerCase();
    return activeProject.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q)),
    );
  }, [activeProject, showMentionMenu, mentionQuery]);

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

  const insertMention = (member: { name: string }) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart || inputText.length;
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
    } else {
      const newText = `${inputText} @${member.name} `;
      setInputText(newText);
      textareaRef.current.focus();
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
          (prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredMembers[highlightedMentionIndex];
        if (selected) insertMention(selected);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !activeProject) return;

    const trimmed = inputText.trim();
    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: trimmed,
      isPinned: false,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: "You",
        employeeId: "",
        position: "",
        avatarUrl: null,
      },
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            user: {
              id: replyingTo.user.id,
              name: replyingTo.user.name,
              employeeId: replyingTo.user.employeeId,
            },
          }
        : null,
      mentions: [],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    const replyTarget = replyingTo;
    setReplyingTo(null);
    setShowMentionMenu(false);
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const res = await sendProjectMessageAction({
        projectId: activeProject.id,
        content: trimmed,
        replyToId: replyTarget?.id,
      });

      if (res.error) {
        alert(res.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (res.message as unknown as ChatMessage) : m)),
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!activeProject) return;
    if (!confirm("Are you sure you want to delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await deleteProjectMessageAction(activeProject.id, messageId);
  };

  const handleTogglePin = async (messageId: string) => {
    if (!activeProject) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m,
      ),
    );
    await togglePinProjectMessageAction(activeProject.id, messageId);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

  const pinnedMessages = messages.filter((m) => m.isPinned);

  // If user has zero projects
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-clay space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-clay-button">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-[17px] font-bold text-foreground">
            No Project Groups Yet
          </h2>
          <p className="text-[13px] text-text-muted">
            Project chat groups are automatically created for every project you
            are assigned to. Once you create or join a project, you and your
            team will be added here automatically.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#101828] text-white text-[13px] font-semibold rounded-xl hover:bg-black transition-colors shadow-clay-button"
        >
          View Projects
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Bar Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-foreground tracking-tight">
              Team Chat & Project Channels
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Auto-Synced Groups
            </span>
          </div>
          <p className="text-[12px] text-text-muted">
            Every project has a dedicated group with all assigned team members
            automatically included.
          </p>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-[calc(100vh-175px)] min-h-[580px]">
        {/* Left Column: Project Channel / Group List */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-border shadow-clay flex flex-col overflow-hidden">
          {/* Header & Search */}
          <div className="p-3 border-b border-border bg-[#F8FAFC]/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Project Channels ({filteredProjects.length})
              </span>
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                Live
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channel or member..."
                className="w-full h-8 pl-8 pr-2.5 text-[12px] bg-[#EEF2F6] border border-transparent rounded-xl focus:bg-white focus:border-primary/40 focus:outline-none shadow-clay-inset transition-all"
              />
            </div>
          </div>

          {/* Channels Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {filteredProjects.map((project) => {
              const isSelected = project.id === activeProjectId;
              const hasMembers = project.members.length;

              return (
                <div
                  key={project.id}
                  onClick={() => selectChannel(project.id)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#EFF6FF] border-l-4 border-l-primary shadow-clay-card"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                          #{project.projectCode}
                        </span>
                        <h3 className="text-[13px] font-bold text-foreground truncate">
                          {project.name}
                        </h3>
                      </div>

                      {/* Last message snippet or member summary */}
                      <p className="text-[11px] text-text-muted truncate mt-1">
                        {project.lastMessage ? (
                          <>
                            <span className="font-semibold text-foreground/80">
                              {project.lastMessage.senderName}:{" "}
                            </span>
                            {project.lastMessage.content}
                          </>
                        ) : (
                          <span className="italic text-text-muted">
                            Channel active • {hasMembers} members
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Users className="w-3 h-3 text-text-muted" />
                        {hasMembers}
                      </span>
                      {project.status && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-hover text-text-secondary border border-border uppercase">
                          {project.status.slice(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="p-6 text-center text-text-muted text-[12px]">
                No matching project channels found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Channel Group Chat */}
        {activeProject ? (
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-border shadow-clay flex flex-col overflow-hidden">
            {/* Channel Top Header */}
            <div className="px-4 py-3 border-b border-border bg-[#F8FAFC]/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#101828] text-white flex items-center justify-center font-bold text-[13px] shadow-clay-button shrink-0">
                  #{activeProject.projectCode.slice(-3)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[15px] font-bold text-foreground">
                      {activeProject.name}
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {activeProject.projectCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMembersDrawer((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-surface hover:bg-surface-hover border border-border px-2 py-0.5 rounded-lg transition-colors"
                      title="Toggle members drawer"
                    >
                      <Users className="w-3 h-3 text-primary" />
                      {activeProject.members.length} Members
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${showMembersDrawer ? "rotate-90" : ""}`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Auto-created project group • Click any member pill to mention
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${activeProject.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <span>Project Overview</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Quick Members Strip / Collapsible Drawer */}
            <div
              className={`bg-[#FAFCFE] border-b border-border transition-all overflow-hidden ${
                showMembersDrawer ? "max-h-56 p-3" : "max-h-12 px-3 py-1.5"
              }`}
            >
              <div className="flex items-center gap-2 overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted shrink-0 mr-1">
                  Team Members:
                </span>
                {activeProject.members.map((member) => {
                  const isActingLead = member.projectRole === "ACTING_LEAD";
                  const isLead = member.isLead;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => insertMention(member)}
                      title={`Click to @mention ${member.name} (${member.position || member.projectRole})`}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-medium border shrink-0 transition-all ${
                        isLead
                          ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#312E81] hover:bg-[#E0E7FF]"
                          : isActingLead
                            ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]"
                            : "bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-[#101828] text-white flex items-center justify-center text-[8px] font-bold">
                        {getInitials(member.name)}
                      </span>
                      <span className="font-semibold">{member.name}</span>

                      {isLead && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-primary text-white">
                          LEAD
                        </span>
                      )}
                      {isActingLead && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white">
                          ACTING LEAD
                        </span>
                      )}
                      {!isLead && !isActingLead && member.position && (
                        <span className="text-[10px] text-text-muted">
                          • {member.position}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pinned Note Banner (if any) */}
            {pinnedMessages.length > 0 && (
              <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 py-2 flex items-center justify-between text-[12px] text-[#92400E]">
                <div className="flex items-center gap-2 truncate">
                  <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />
                  <span className="font-bold shrink-0">Pinned Note:</span>
                  <span className="truncate italic">
                    "{pinnedMessages[pinnedMessages.length - 1]?.content}"
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700">
                  {pinnedMessages.length} Pinned
                </span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]/40">
              {messages.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-[14px] font-bold text-foreground">
                    Welcome to the {activeProject.name} Channel
                  </h4>
                  <p className="text-[12px] text-text-muted max-w-sm mx-auto">
                    This group is automatically synced with all{" "}
                    {activeProject.members.length} team members. Use @ to
                    mention team members, discuss blockers, or share sprint
                    deliverables.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAuthor = m.user.id === currentUserId;
                  const canDelete = isAuthor || isLeadOrAdmin;

                  return (
                    <div
                      key={m.id}
                      ref={(el) => {
                        messageRefs.current[m.id] = el;
                      }}
                      className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                        m.isPinned
                          ? "bg-amber-50/70 border border-amber-200/80"
                          : "hover:bg-white hover:shadow-clay-card"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-[#101828] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {getInitials(m.user.name)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-foreground">
                            {m.user.name}
                          </span>
                          {m.user.position && (
                            <span className="text-[10px] font-medium text-text-muted">
                              {m.user.position}
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {m.isPinned && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              <Pin className="w-2.5 h-2.5 fill-amber-700" />
                              Pinned
                            </span>
                          )}
                        </div>

                        {/* Reply reference */}
                        {m.replyTo && (
                          <div className="mt-1 pl-2.5 border-l-2 border-primary/50 text-[11px] text-text-muted italic bg-surface/50 py-0.5 rounded-r">
                            <span className="font-semibold text-foreground/80">
                              @{m.replyTo.user.name}:{" "}
                            </span>
                            {m.replyTo.content.slice(0, 90)}
                          </div>
                        )}

                        {/* Message body */}
                        <p className="text-[13px] text-foreground leading-relaxed mt-1 whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      </div>

                      {/* Hover Action Bar */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border border-border shadow-sm rounded-lg p-0.5 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(m)}
                          className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface transition-colors"
                          title="Reply"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {isLeadOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(m.id)}
                            className="p-1 rounded text-text-muted hover:text-amber-600 hover:bg-surface transition-colors"
                            title={m.isPinned ? "Unpin" : "Pin"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="p-1 rounded text-text-muted hover:text-red-600 hover:bg-surface transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Composer */}
            <div className="p-3 border-t border-border bg-white space-y-2">
              {/* Replying banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-[12px]">
                  <div className="flex items-center gap-1.5 truncate text-[#1E40AF]">
                    <Reply className="w-3.5 h-3.5 shrink-0" />
                    <span>Replying to</span>
                    <span className="font-bold">@{replyingTo.user.name}</span>
                    <span className="text-text-muted truncate">
                      : "{replyingTo.content.slice(0, 60)}"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-text-muted hover:text-foreground p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Mentions popup */}
              {showMentionMenu && filteredMembers.length > 0 && (
                <div className="p-1.5 bg-white border border-border rounded-xl shadow-clay space-y-0.5 max-h-44 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Mention Team Member
                  </div>
                  {filteredMembers.map((member, idx) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => insertMention(member)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[12px] transition-colors ${
                        idx === highlightedMentionIndex
                          ? "bg-primary text-white"
                          : "hover:bg-surface-hover text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">@{member.name}</span>
                        <span
                          className={`text-[10px] ${
                            idx === highlightedMentionIndex
                              ? "text-white/80"
                              : "text-text-muted"
                          }`}
                        >
                          {member.employeeId}
                        </span>
                      </div>
                      {member.position && (
                        <span
                          className={`text-[10px] ${
                            idx === highlightedMentionIndex
                              ? "text-white/90"
                              : "text-text-secondary"
                          }`}
                        >
                          {member.position}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea & Send Button */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message #${activeProject.projectCode} channel... (type @ to mention a member)`}
                  rows={2}
                  className="w-full p-2.5 pr-14 text-[13px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-clay-inset resize-none transition-all placeholder:text-text-muted"
                />

                <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertMention({ name: "" })}
                    className="p-1.5 text-text-muted hover:text-primary rounded-lg transition-colors"
                    title="Mention someone"
                  >
                    <AtSign className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || !inputText.trim()}
                    className="p-1.5 bg-[#101828] text-white hover:bg-black disabled:opacity-40 rounded-lg shadow-clay-button transition-all"
                    title="Send message (Enter)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-border shadow-clay flex items-center justify-center p-8 text-center text-text-muted">
            Select a project channel to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
