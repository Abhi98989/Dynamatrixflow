"use client";

import Link from "next/link";
import { Target } from "lucide-react";

const COLUMNS = [
  { key: "TODO", label: "To Do", dot: "bg-[#667085]" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-[#2563EB]" },
  { key: "BLOCKED", label: "Blocked", dot: "bg-[#DC2626]" },
  { key: "IN_REVIEW", label: "In Review", dot: "bg-[#7C3AED]" },
  { key: "COMPLETED", label: "Completed", dot: "bg-[#15803D]" },
];

const priorityColor: Record<string, string> = {
  CRITICAL: "text-red-600",
  HIGH: "text-orange-600",
  MEDIUM: "text-amber-600",
  LOW: "text-text-muted",
};

const highlightCardStyles: Record<string, string> = {
  YELLOW: "border-t-4 border-t-[#F59E0B] bg-[#FFFBEB]/30",
  RED: "border-t-4 border-t-[#EF4444] bg-[#FEF2F2]/30",
  PURPLE: "border-t-4 border-t-[#8B5CF6] bg-[#F5F3FF]/30",
  BLUE: "border-t-4 border-t-[#3B82F6] bg-[#EFF6FF]/30",
  GREEN: "border-t-4 border-t-[#10B981] bg-[#F0FDF4]/30",
};

export interface KanbanTask {
  id: string;
  taskCode: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  assignee?: { id: string; name: string | null } | null;
  isPointed?: boolean;
  highlightColor?: string | null;
}

export function KanbanBoard({
  tasks,
  projectId,
}: {
  tasks: KanbanTask[];
  projectId: string;
}) {
  const now = new Date().getTime();
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  const pointedTask = tasks.find((t) => t.isPointed);

  return (
    <div className="space-y-4">
      {/* Active Team Pointer Banner */}
      {pointedTask && (
        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between shadow-clay-inset">
          <div className="flex items-center gap-3 min-w-0">
            <span className="size-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Target className="size-4 animate-pulse" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Active Team Pointer
                </span>
                <span className="font-mono text-[12px] font-bold text-foreground">
                  {pointedTask.taskCode}
                </span>
              </div>
              <p className="text-[13px] font-medium text-text-secondary truncate mt-0.5">
                {pointedTask.title}
                {pointedTask.assignee?.name && (
                  <span className="text-text-muted ml-2 text-[12px]">
                    • Assigned to {pointedTask.assignee.name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/projects/${projectId}/tasks/${pointedTask.id}`}
            className="text-[11px] font-semibold text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-md transition-colors shrink-0 shadow-xs"
          >
            Open Task
          </Link>
        </div>
      )}

      {/* Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 touch-pan-x snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="snap-start min-w-[250px] w-[82vw] sm:w-[260px] shrink-0 flex flex-col"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-[12px] font-bold text-foreground uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-[11px] font-bold text-text-muted ml-auto">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {colTasks.map((task) => {
                  const cardHighlight = task.highlightColor
                    ? highlightCardStyles[task.highlightColor] || ""
                    : "";
                  const isPointedCard = Boolean(task.isPointed);

                  return (
                    <Link
                      key={task.id}
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className={`block rounded-[12px] border border-border-subtle p-3.5 hover:border-primary/40 transition-all ${
                        cardHighlight || "bg-surface shadow-sm"
                      } ${isPointedCard ? "ring-2 ring-primary shadow-clay" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-text-muted">
                            {task.taskCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${priorityColor[task.priority] || "text-amber-600"}`}
                          >
                            {task.priority.charAt(0) +
                              task.priority.slice(1).toLowerCase()}
                          </span>
                          {isPointedCard && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-primary text-white">
                              <Target className="size-2.5 animate-pulse" />{" "}
                              Focus
                            </span>
                          )}
                        </div>
                        {task.assignee && (
                          <div
                            className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[8px] font-bold shadow-[0_2px_4px_rgba(30,58,138,0.2)]"
                            title={task.assignee.name || "Assignee"}
                          >
                            {getInitials(task.assignee.name || "U")}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <div
                          className={`text-[10px] mt-2.5 font-medium ${new Date(task.dueDate).getTime() < now ? "text-red-600" : "text-text-muted"}`}
                        >
                          Due{" "}
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                    </Link>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="border border-dashed border-border-subtle rounded-xl py-8 text-center text-[12px] text-text-muted">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
