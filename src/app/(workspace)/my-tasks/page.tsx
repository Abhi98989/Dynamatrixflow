import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { TaskList } from "@/features/tasks/task-list";
import { TaskStatus, SystemRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Tasks | Dynamatrix Flow",
  description: "Track and update all technical deliverables assigned to you.",
};

export default async function MyTasksPage() {
  const currentUser = await requireActiveUser();

  const tasks = await db.task.findMany({
    where: {
      assigneeId: currentUser.id,
      archivedAt: null,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          projectLeadId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      _count: {
        select: {
          subtasks: true,
          comments: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const now = new Date();
  const overdueCount = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED &&
      new Date(t.dueDate) < now,
  ).length;

  const inProgressCount = tasks.filter(
    (t) =>
      t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW,
  ).length;

  const completedCount = tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED,
  ).length;

  const isLeadOrAdmin = currentUser.systemRole === SystemRole.ADMIN;

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground tracking-tight">
              My Tasks
            </h1>
            <span className="text-[10px] font-bold text-primary bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.2 rounded-full">
              {tasks.length} Assigned
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Deliverables assigned to you across all project workspaces.
          </p>
        </div>
      </div>

      {/* Metrics Row — Authentic Clay */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-surface rounded-2xl p-2.5 sm:p-3 border border-[rgba(220,227,240,0.9)] shadow-clay hover:shadow-clay-hover transition-all">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
            Total Assigned
          </span>
          <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none mt-1 block">
            {tasks.length}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5 block">all workspaces</span>
        </div>

        <div className="bg-surface rounded-2xl p-2.5 sm:p-3 border border-[rgba(220,227,240,0.9)] shadow-clay hover:shadow-clay-hover transition-all">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums leading-none mt-1 block">
            {inProgressCount}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5 block">active work</span>
        </div>

        <div className="bg-surface rounded-2xl p-2.5 sm:p-3 border border-[rgba(220,227,240,0.9)] shadow-clay hover:shadow-clay-hover transition-all">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#15803D] tabular-nums leading-none mt-1 block">
            {completedCount}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5 block">delivered</span>
        </div>

        <div className="bg-surface rounded-2xl p-2.5 sm:p-3 border border-[rgba(220,227,240,0.9)] shadow-clay hover:shadow-clay-hover transition-all">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">
            Overdue
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold tabular-nums leading-none mt-1 block ${
              overdueCount > 0 ? "text-red-600" : "text-foreground"
            }`}
          >
            {overdueCount}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5 block">
            {overdueCount > 0 ? "needs attention" : "on schedule"}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <TaskList
        tasks={tasks}
        currentUserId={currentUser.id}
        isLeadOrAdmin={isLeadOrAdmin}
        basePath="/my-tasks"
      />
    </div>
  );
}
