"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  X, ExternalLink, Calendar,
  MessageSquare, Loader2
} from "lucide-react";
import { getTaskDetailsAction, toggleSubtaskAction, createSubtaskAction } from "./actions";
import { updateTaskStatusAction } from "./actions";
import { createTaskCommentAction } from "@/features/comments/actions";
import { TaskStatus } from "@prisma/client";

type TaskDetailsResult = Awaited<ReturnType<typeof getTaskDetailsAction>>;

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDrawer({ taskId, onClose, onTaskUpdated }: TaskDrawerProps) {
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
    startStatusTransition(async () => {
      const res = await updateTaskStatusAction(task.id, newStatus as TaskStatus, task.progress);
      if (res.success) {
        await loadTask(task.id);
        if (onTaskUpdated) onTaskUpdated();
      }
    });
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await toggleSubtaskAction(subtaskId);
    if (task) {
      await loadTask(task.id);
      if (onTaskUpdated) onTaskUpdated();
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;

    await createSubtaskAction(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    await loadTask(task.id);
    if (onTaskUpdated) onTaskUpdated();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    startCommentTransition(async () => {
      await createTaskCommentAction(task.id, newComment.trim());
      setNewComment("");
      await loadTask(task.id);
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
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-hidden">
        {loading || !task ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#5B5FEF]" />
            <span className="text-xs">Loading task details...</span>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#5B5FEF] bg-[#5B5FEF]/10 px-2 py-0.5 rounded">
                  {task.taskCode}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                  {task.project?.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  title="Open Full Page View"
                  onClick={onClose}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
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
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {task.title}
                </h2>
                
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select
                      value={task.status}
                      disabled={!canEdit || isUpdatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border border-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#5B5FEF] ${
                        statusColor[task.status] || "bg-slate-100 text-slate-700"
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

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColor[task.priority] || priorityColor.MEDIUM}`}>
                    {task.priority} PRIORITY
                  </span>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Assignee</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {task.assignee ? task.assignee.name.charAt(0) : "?"}
                    </div>
                    <span className="font-semibold text-slate-800 truncate">
                      {task.assignee ? task.assignee.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Due Date</span>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>
              )}

              {/* Subtasks Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Checklist ({task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length})
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {task.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => canEdit && handleToggleSubtask(st.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-colors ${
                        canEdit ? "cursor-pointer" : ""
                      } ${
                        st.isCompleted
                          ? "bg-slate-50 border-slate-100 text-slate-400 line-through"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#5B5FEF] focus:ring-[#5B5FEF]"
                      />
                      <span className="flex-1 truncate">{st.title}</span>
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2.5">
                    <input
                      type="text"
                      placeholder="Add subtask item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#5B5FEF]"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Comments Feed */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Discussion ({task.comments.length})
                </h4>

                <div className="space-y-2 mb-3">
                  {task.comments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-3 text-center">
                      No comments yet. Start the conversation below.
                    </p>
                  ) : (
                    task.comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700">{c.user.name}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{c.content}</p>
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
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#5B5FEF] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-3 py-2 bg-[#5B5FEF] hover:bg-[#4C50D8] text-white rounded-lg text-xs font-semibold self-end disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
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
