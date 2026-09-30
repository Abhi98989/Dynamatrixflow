import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { TaskList } from "@/features/tasks/task-list";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              My Tasks
            </h1>
            <span className="rounded-full bg-review-bg px-2.5 py-0.5 text-xs font-semibold text-primary">
              {tasks.length} Assigned
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Deliverables assigned to you across all project workspaces.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Total Assigned</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {tasks.length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">In Progress / Review</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {inProgressCount}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">Completed Work</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {completedCount}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">Overdue</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              overdueCount > 0 ? "text-red-600" : "text-text-primary"
            }`}
          >
            {overdueCount}
          </p>
        </Card>
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
