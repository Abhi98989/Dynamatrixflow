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
  ExternalLink,
  ChevronDown,
  Hash,
  ShieldCheck,
  Crown,
  Sparkles,
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

  // Team member sheet / drawer state (only show member names when clicked)
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [memberFilterQuery, setMemberFilterQuery] = useState("");

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
    setShowMembersPanel(false);
  }, [initialActiveProjectId, initialMessages]);

  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === activeProjectId) || projects[0] || null
    );
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

  // Filter project groups in left sidebar by project name
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
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

  // Members inside drawer filtering
  const drawerMembers = useMemo(() => {
    if (!activeProject) return [];
    if (!memberFilterQuery.trim()) return activeProject.members;
    const q = memberFilterQuery.toLowerCase().trim();
    return activeProject.members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q)) ||
        m.projectRole.toLowerCase().includes(q),
    );
  }, [activeProject, memberFilterQuery]);

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
      const newText = `${inputText}${inputText.endsWith(" ") || inputText.length === 0 ? "" : " "}@${member.name} `;
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
          prev.map((m) =>
            m.id === tempId ? (res.message as unknown as ChatMessage) : m,
          ),
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
      <div className="bg-white rounded-3xl border border-[#DCE3F0] p-8 text-center shadow-clay space-y-4 max-w-md mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-clay-button">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-[17px] font-bold text-[#0B1220]">
            No Project Channels
          </h2>
          <p className="text-[13px] text-text-muted">
            Project chat groups are automatically created for each project you
            join.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-clay-button"
        >
          View Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col gap-2">
      {/* Main Clay Container Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 h-full overflow-hidden">
        {/* Left Column: Project Channel / Group List */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white rounded-2xl border border-[#DCE3F0] shadow-clay flex flex-col overflow-hidden">
          {/* Channel Header & Search */}
          <div className="p-3 border-b border-[#E9EEF6] bg-gradient-to-b from-[#F8FAFF] to-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Project Channels
              </span>
              <span className="text-[11px] font-semibold text-primary bg-[#E8EEFF] px-2 py-0.5 rounded-full">
                {projects.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channel..."
                className="w-full h-8 pl-8 pr-2.5 text-[12px] bg-[#F8FAFF] border border-[#DCE3F0]/80 rounded-xl focus:bg-white focus:border-primary focus:outline-none shadow-clay-inset transition-all"
              />
            </div>
          </div>

          {/* Channels Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F4FA] p-1.5 space-y-1">
            {filteredProjects.map((project) => {
              const isSelected = project.id === activeProjectId;
              const hasMembers = project.members.length;

              return (
                <div
                  key={project.id}
                  onClick={() => selectChannel(project.id)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? "bg-[#EFF4FF] border border-[#BFDBFE] shadow-clay-subtle"
                      : "hover:bg-[#F8FAFC] border border-transparent"
                  }`}
                >
                  {/* Clean Hashtag Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#1E3A8A] text-white shadow-clay-button"
                        : "bg-[#F1F4FA] text-[#475467] group-hover:bg-[#E8EEFF] group-hover:text-primary"
                    }`}
                  >
                    <Hash className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  {/* Clean Project Name (NO ID prefix clutter) */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`text-[13px] truncate ${
                          isSelected
                            ? "font-bold text-[#0B1220]"
                            : "font-medium text-[#344054]"
                        }`}
                      >
                        {project.name}
                      </h3>
                      {project.status && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F1F4FA] text-[#667085] uppercase shrink-0">
                          {project.status}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {project.lastMessage ? (
                        <>
                          <span className="font-medium text-[#475467]">
                            {project.lastMessage.senderName}:{" "}
                          </span>
                          {project.lastMessage.content}
                        </>
                      ) : (
                        <span>{hasMembers} team members</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="p-6 text-center text-text-muted text-[12px]">
                No matching project channels.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Channel Group Chat */}
        {activeProject ? (
          <div className="lg:col-span-8 xl:col-span-8.5 bg-white rounded-2xl border border-[#DCE3F0] shadow-clay flex flex-col overflow-hidden relative">
            {/* Channel Top Header */}
            <div className="px-4 py-2.5 border-b border-[#E9EEF6] bg-gradient-to-b from-[#F8FAFF] to-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[13px] shadow-clay-button shrink-0">
                  <Hash className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  {/* Clean Project Name as Chat Group Name */}
                  <h2 className="text-[15px] font-bold text-[#0B1220] truncate">
                    {activeProject.name}
                  </h2>
                  <p className="text-[11px] text-text-muted truncate">
                    Auto-created project channel • Click members to mention
                  </p>
                </div>
              </div>

              {/* Action buttons: Member Pill (click to show names) and Overview */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Team Members Button -> Only shows member names on click */}
                <button
                  type="button"
                  onClick={() => setShowMembersPanel((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[12px] font-semibold transition-all ${
                    showMembersPanel
                      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-clay-button"
                      : "bg-[#F8FAFF] text-[#344054] border-[#DCE3F0] hover:bg-[#EEF2F6] hover:border-[#CBD5E1]"
                  }`}
                  title="View project team members"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{activeProject.members.length} Members</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showMembersPanel ? "rotate-180" : ""}`}
                  />
                </button>

                <Link
                  href={`/projects/${activeProject.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1E3A8A] hover:text-[#1A3278] bg-[#E8EEFF] hover:bg-[#DCE7FE] px-2.5 py-1.5 rounded-xl transition-colors"
                  title="Open Project"
                >
                  <span>Project</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Pinned Note Banner (if any) */}
            {pinnedMessages.length > 0 && (
              <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 py-1.5 flex items-center justify-between text-[12px] text-[#92400E] shrink-0">
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

            {/* Chat Body: Messages area with optional side panel for members */}
            <div className="flex-1 flex overflow-hidden relative bg-[#F8FAFC]/50">
              {/* Messages Scroll Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="py-20 text-center space-y-2">
                    <div className="w-11 h-11 rounded-2xl bg-[#E8EEFF] text-[#1E3A8A] flex items-center justify-center mx-auto shadow-clay-button">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h4 className="text-[14px] font-bold text-[#0B1220]">
                      Welcome to #{activeProject.name}
                    </h4>
                    <p className="text-[12px] text-text-muted max-w-sm mx-auto">
                      All {activeProject.members.length} project collaborators
                      are included. Use @ to mention anyone or discuss deliverables.
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
                        className={`group flex items-start gap-2.5 p-2 rounded-2xl transition-all ${
                          m.isPinned
                            ? "bg-amber-50/80 border border-amber-200"
                            : "hover:bg-white hover:shadow-clay-subtle"
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
                            <span className="text-[13px] font-bold text-[#0B1220]">
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
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
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
                              {m.replyTo.content.slice(0, 80)}
                            </div>
                          )}

                          {/* Message body */}
                          <p className="text-[13px] text-[#0B1220] leading-relaxed mt-1 whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                        </div>

                        {/* Hover Action Bar */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border border-[#DCE3F0] shadow-sm rounded-lg p-0.5 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(m)}
                            className="p-1 rounded text-text-muted hover:text-primary hover:bg-[#F8FAFF] transition-colors"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {isLeadOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleTogglePin(m.id)}
                              className="p-1 rounded text-text-muted hover:text-amber-600 hover:bg-[#F8FAFF] transition-colors"
                              title={m.isPinned ? "Unpin" : "Pin"}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(m.id)}
                              className="p-1 rounded text-text-muted hover:text-red-600 hover:bg-[#F8FAFF] transition-colors"
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

              {/* Slide-out Team Members Panel (Only appears when "Members" is clicked!) */}
              {showMembersPanel && (
                <div className="w-72 bg-white border-l border-[#DCE3F0] shadow-clay flex flex-col z-20 transition-all animate-in slide-in-from-right duration-200">
                  {/* Panel Header */}
                  <div className="p-3 border-b border-[#E9EEF6] bg-[#F8FAFF] flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold text-[#0B1220]">
                        Project Members
                      </h3>
                      <p className="text-[11px] text-text-muted">
                        {activeProject.members.length} collaborators in group
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMembersPanel(false)}
                      className="p-1 rounded-lg text-text-muted hover:text-[#0B1220] hover:bg-[#EEF2F6]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Panel Member Search */}
                  <div className="p-2 border-b border-[#E9EEF6]">
                    <div className="relative">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        type="text"
                        value={memberFilterQuery}
                        onChange={(e) => setMemberFilterQuery(e.target.value)}
                        placeholder="Search member..."
                        className="w-full h-7 pl-6 pr-2 text-[11px] bg-[#F8FAFF] border border-[#DCE3F0] rounded-lg focus:outline-none focus:border-primary shadow-clay-inset"
                      />
                    </div>
                  </div>

                  {/* Panel Member List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#F1F4FA]">
                    {drawerMembers.map((member) => {
                      const isActingLead =
                        (member.projectRole as string) === "ACTING_LEAD";
                      const isLead = member.isLead;

                      return (
                        <div
                          key={member.id}
                          className="pt-1.5 pb-1 flex items-center justify-between gap-2 hover:bg-[#F8FAFC] px-1.5 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#101828] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                              {getInitials(member.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[12px] font-bold text-[#0B1220] truncate">
                                  {member.name}
                                </span>
                                {isLead && (
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-primary text-white">
                                    LEAD
                                  </span>
                                )}
                                {isActingLead && (
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500 text-white">
                                    ACTING LEAD
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-text-muted truncate">
                                {member.position || member.projectRole}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              insertMention(member);
                              setShowMembersPanel(false);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8EEFF] text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
                            title="Mention in chat"
                          >
                            @ Mention
                          </button>
                        </div>
                      );
                    })}

                    {drawerMembers.length === 0 && (
                      <div className="p-4 text-center text-text-muted text-[11px]">
                        No members found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Composer */}
            <div className="p-3 border-t border-[#E9EEF6] bg-white space-y-2 shrink-0">
              {/* Replying banner */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#EFF4FF] border border-[#BFDBFE] rounded-xl text-[12px]">
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
                <div className="p-1.5 bg-white border border-[#DCE3F0] rounded-2xl shadow-clay space-y-0.5 max-h-44 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Mention Team Member
                  </div>
                  {filteredMembers.map((member, idx) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => insertMention(member)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[12px] transition-colors ${
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

              {/* Input Clay Container */}
              <div className="relative bg-[#F8FAFF] rounded-2xl border border-[#DCE3F0] shadow-clay-inset p-2.5">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message #${activeProject.name}... (type @ to mention a member)`}
                  rows={2}
                  className="w-full pr-24 text-[13px] bg-transparent text-[#0B1220] focus:outline-none resize-none placeholder:text-text-muted"
                />

                <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
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
                    className="px-3.5 py-1.5 bg-[#1E3A8A] text-white hover:bg-[#1A3278] active:translate-y-0.5 disabled:opacity-40 rounded-xl shadow-clay-button text-[12px] font-semibold flex items-center gap-1 transition-all"
                    title="Send message (Enter)"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 xl:col-span-8.5 bg-white rounded-2xl border border-[#DCE3F0] shadow-clay flex items-center justify-center p-8 text-center text-text-muted">
            Select a project channel to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
