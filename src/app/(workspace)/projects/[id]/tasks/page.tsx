import { db } from "@/server/db/client";
import {
  requireActiveUser,
  canViewProject,
  canManageProject,
} from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { TaskList } from "@/features/tasks/task-list";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { SystemRole } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TasksPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const isManager = await canManageProject(currentUser.id, projectId);

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      projectCode: true,
      projectLeadId: true,
      members: {
        where: { removedAt: null },
        include: {
          user: {
            select: { id: true, name: true, employeeId: true, position: true },
          },
        },
      },
      milestones: {
        where: { archivedAt: null },
        select: { id: true, name: true, milestoneCode: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!project) notFound();

  const tasks = await db.task.findMany({
    where: { projectId, archivedAt: null },
    include: {
      assignee: { select: { id: true, name: true, employeeId: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const isLeadOrAdmin =
    currentUser.systemRole === SystemRole.ADMIN ||
    project.projectLeadId === currentUser.id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-foreground">
            Project Tasks
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            {tasks.length} deliverables across all milestones
          </p>
        </div>
        {isManager && (
          <CreateTaskDialog
            projectId={project.id}
            members={project.members}
            milestones={project.milestones}
          />
        )}
      </div>
      <TaskList
        tasks={tasks}
        currentUserId={currentUser.id}
        isLeadOrAdmin={isLeadOrAdmin}
        basePath={`/projects/${project.id}/tasks`}
      />
    </div>
  );
}
