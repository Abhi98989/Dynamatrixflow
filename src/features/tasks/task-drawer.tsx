"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Calendar,
  MessageSquare,
  Loader2,
  Target,
} from "lucide-react";
import {
  getTaskDetailsAction,
  toggleSubtaskAction,
  createSubtaskAction,
  toggleTaskPointerAction,
  setTaskHighlightAction,
} from "./actions";
import { updateTaskStatusAction } from "./actions";
import { createTaskCommentAction } from "@/features/comments/actions";
import { TaskStatus } from "@prisma/client";

type TaskDetailsResult = Awaited<ReturnType<typeof getTaskDetailsAction>>;

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDrawer({
  taskId,
  onClose,
  onTaskUpdated,
}: TaskDrawerProps) {
  const [data, setData] = useState<TaskDetailsResult>(null);
  const [loading, setLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, startCommentTransition] = useTransition();
  const [isUpdatingStatus, startStatusTransition] = useTransition();

  const loadTask = async (id: string) => {
    setLoading(true);
    const res = await getTaskDetailsAction(id);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    if (taskId) {
      const timer = setTimeout(() => {
        if (active) {
          loadTask(taskId);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      const timer = setTimeout(() => {
        if (active) {
          setData(null);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [taskId]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && taskId) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [taskId, onClose]);

  if (!taskId) return null;

  const task = data?.task;
  const canEdit = data?.canEdit;

  const handleStatusChange = (newStatus: string) => {
    if (!task) return;

    let blockerReason = "";
    if (newStatus === TaskStatus.BLOCKED) {
      const reason = window.prompt(
        "Please provide a reason for blocking this task:",
      );
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        alert("A blocker reason is required.");
        return;
      }
      blockerReason = reason.trim();
    }

    startStatusTransition(async () => {
      const res = await updateTaskStatusAction(
        task.id,
        newStatus as TaskStatus,
        task.progress,
        blockerReason,
      );
      if (res.success) {
        await loadTask(task.id);
        if (onTaskUpdated) onTaskUpdated();
      } else {
        alert(res.error || "Failed to update status.");
      }
    });
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const res = await toggleSubtaskAction(subtaskId);
    if (res.error) {
      alert(res.error);
      return;
    }
    if (task) {
      await loadTask(task.id);
      if (onTaskUpdated) onTaskUpdated();
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;

    const res = await createSubtaskAction(task.id, newSubtaskTitle.trim());
    if (res.success) {
      setNewSubtaskTitle("");
      await loadTask(task.id);
      if (onTaskUpdated) onTaskUpdated();
    } else {
      alert(res.error || "Failed to create subtask.");
    }
  };

  const handleTogglePointer = async () => {
    if (!task) return;
    const res = await toggleTaskPointerAction(task.id);
    if (res.success) {
      await loadTask(task.id);
      if (onTaskUpdated) onTaskUpdated();
    } else {
      alert(res.error || "Failed to toggle pointer.");
    }
  };

  const handleSetHighlight = async (color: string | null) => {
    if (!task) return;
    const res = await setTaskHighlightAction(task.id, color);
    if (res.success) {
      await loadTask(task.id);
      if (onTaskUpdated) onTaskUpdated();
    } else {
      alert(res.error || "Failed to set highlight.");
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    startCommentTransition(async () => {
      const res = await createTaskCommentAction(task.id, newComment.trim());
      if (res.success) {
        setNewComment("");
        await loadTask(task.id);
      } else {
        alert(res.error || "Failed to add comment.");
      }
    });
  };

  const priorityColor: Record<string, string> = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const statusColor: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_REVIEW: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    BLOCKED: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-Over Drawer Content */}
      <div className="w-full max-w-xl bg-surface h-full shadow-clay flex flex-col border-l border-border animate-in slide-in-from-right duration-200 overflow-hidden">
        {loading || !task ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading task details...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-background">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {task.taskCode}
                </span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs font-semibold text-text-secondary truncate max-w-[200px]">
                  {task.project?.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                  className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Open Full Page View"
                  onClick={onClose}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Title & Status */}
              <div>
                <h2 className="text-lg font-bold text-foreground leading-snug">
                  {task.title}
                </h2>

                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={task.status}
                      disabled={!canEdit || isUpdatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border border-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${
                        statusColor[task.status] ||
                        "bg-background text-text-secondary"
                      }`}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColor[task.priority] || priorityColor.MEDIUM}`}
                  >
                    {task.priority} PRIORITY
                  </span>

                  {/* Active Focus Pointer Button */}
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={handleTogglePointer}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
                      task.isPointed
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface text-text-secondary border-border-subtle hover:bg-surface-hover hover:text-foreground"
                    }`}
                    title={
                      task.isPointed
                        ? "Active Focus Pointer (Click to clear)"
                        : "Point to this task for team focus"
                    }
                  >
                    <Target className="w-3.5 h-3.5" />
                    {task.isPointed ? "🎯 Focused Pointer" : "Point Task"}
                  </button>

                  {/* Highlighter Palette */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1">
                    <span className="text-[10px] text-slate-500 font-semibold mr-0.5">
                      Highlighter:
                    </span>
                    {[
                      { key: "YELLOW", color: "bg-[#F59E0B]", name: "Amber" },
                      { key: "RED", color: "bg-[#EF4444]", name: "Red" },
                      { key: "PURPLE", color: "bg-[#8B5CF6]", name: "Purple" },
                      { key: "BLUE", color: "bg-[#3B82F6]", name: "Blue" },
                      { key: "GREEN", color: "bg-[#10B981]", name: "Green" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        disabled={!canEdit}
                        onClick={() =>
                          handleSetHighlight(
                            task.highlightColor === c.key ? null : c.key,
                          )
                        }
                        className={`w-3.5 h-3.5 rounded-full ${c.color} transition-transform ${
                          task.highlightColor === c.key
                            ? "ring-2 ring-slate-900 scale-110"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={`Highlight ${c.name}`}
                      />
                    ))}
                    {task.highlightColor && (
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleSetHighlight(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 px-1 font-bold"
                        title="Clear highlight"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-background rounded-xl border border-border-subtle shadow-clay-inset text-xs">
                <div>
                  <span className="text-[11px] text-text-muted block font-medium">
                    Assignee
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-[0_2px_4px_rgba(30,58,138,0.2)]">
                      {task.assignee ? task.assignee.name.charAt(0) : "?"}
                    </div>
                    <span className="font-semibold text-foreground truncate">
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-text-muted block font-medium">
                    Due Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <div className="text-[13px] text-text-secondary leading-relaxed bg-background p-3.5 rounded-[12px] border border-border shadow-sm whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Subtasks Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Checklist (
                    {task.subtasks.filter((s) => s.isCompleted).length}/
                    {task.subtasks.length})
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {task.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => canEdit && handleToggleSubtask(st.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-[13px] transition-colors ${
                        canEdit ? "cursor-pointer" : ""
                      } ${
                        st.isCompleted
                          ? "bg-background border-border text-text-muted line-through"
                          : "bg-surface border-border-subtle text-foreground hover:border-border shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="flex-1 truncate">{st.title}</span>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <form
                    onSubmit={handleAddSubtask}
                    className="flex gap-2 mt-2.5"
                  >
                    <input
                      type="text"
                      placeholder="Add subtask item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 text-[13px] px-3 py-2 rounded-xl border border-border-subtle bg-background focus:outline-none focus:border-primary shadow-clay-inset"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-4 py-2 bg-sidebar text-white rounded-xl text-xs font-semibold hover:bg-sidebar-active disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Comments Feed */}
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Discussion (
                  {task.comments.length})
                </h4>

                <div className="space-y-3 mb-4">
                  {task.comments.length === 0 ? (
                    <p className="text-[11px] text-text-muted py-3 text-center">
                      No comments yet. Start the conversation below.
                    </p>
                  ) : (
                    task.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-[12px] bg-background border border-border shadow-sm text-[13px]"
                      >
                        <div className="flex items-center justify-between text-[11px] text-text-muted mb-1.5">
                          <span className="font-semibold text-foreground">
                            {c.user.name}
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-text-secondary whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a message or status note..."
                    className="flex-1 text-[13px] p-3 rounded-[12px] border border-border-subtle bg-background focus:outline-none focus:border-primary resize-none shadow-clay-inset"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold self-end disabled:opacity-50 flex items-center gap-1 shadow-sm transition-colors"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
