import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { KanbanBoard } from "@/features/tasks/kanban-board";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const tasks = await db.task.findMany({
    where: { projectId, archivedAt: null },
    include: {
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">Board</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Kanban view of all tasks
        </p>
      </div>
      <KanbanBoard tasks={tasks} projectId={projectId} />
    </div>
  );
}
