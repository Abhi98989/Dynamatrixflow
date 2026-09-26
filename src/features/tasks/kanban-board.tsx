"use client";

import Link from "next/link";

const COLUMNS = [
  { key: "TODO", label: "To Do", dot: "bg-[#667085]" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "bg-[#2563EB]" },
  { key: "BLOCKED", label: "Blocked", dot: "bg-[#DC2626]" },
  { key: "IN_REVIEW", label: "In Review", dot: "bg-[#7C3AED]" },
  { key: "COMPLETED", label: "Completed", dot: "bg-[#15803D]" },
];

const priorityColor: Record<string, string> = {
  CRITICAL: "text-[#DC2626]", HIGH: "text-[#EA580C]", MEDIUM: "text-[#D97706]", LOW: "text-[#64748B]",
};

export interface KanbanTask {
  id: string;
  taskCode: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  assignee?: { id: string; name: string | null } | null;
}

export function KanbanBoard({ tasks, projectId }: { tasks: KanbanTask[]; projectId: string }) {
  const now = new Date().getTime();
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="min-w-[260px] w-[260px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center gap-2 px-2 py-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-[12px] font-bold text-[#101828] uppercase tracking-wider">{col.label}</span>
              <span className="text-[11px] font-bold text-[#98A2B3] ml-auto">{colTasks.length}</span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 flex-1">
              {colTasks.map(task => (
                <Link
                  key={task.id}
                  href={`/projects/${projectId}/tasks/${task.id}`}
                  className="block bg-white rounded-lg border border-[#E4E7EC] p-3 hover:border-[#5B5FEF]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-[13px] font-semibold text-[#101828] leading-tight line-clamp-2">{task.title}</h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#98A2B3]">{task.taskCode}</span>
                      <span className={`text-[10px] font-bold ${priorityColor[task.priority] || "text-[#D97706]"}`}>
                        {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {task.assignee && (
                      <div className="w-5 h-5 rounded-full bg-[#101828] text-white flex items-center justify-center text-[8px] font-bold" title={task.assignee.name || "Assignee"}>
                        {getInitials(task.assignee.name || "U")}
                      </div>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className={`text-[10px] mt-2 font-medium ${new Date(task.dueDate).getTime() < now ? "text-[#DC2626]" : "text-[#98A2B3]"}`}>
                      Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </Link>
              ))}
              {colTasks.length === 0 && (
                <div className="border border-dashed border-[#E4E7EC] rounded-lg py-8 text-center text-[12px] text-[#98A2B3]">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
