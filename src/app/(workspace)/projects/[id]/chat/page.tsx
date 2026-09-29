import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { ProjectChatView } from "@/features/chat/project-chat-view";
import { SystemRole } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectChatPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

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
            select: {
              id: true,
              name: true,
              employeeId: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  // Load project messages
  const rawMessages = await db.projectMessage.findMany({
    where: { projectId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          position: true,
          avatarUrl: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 150,
  });

  const isLeadOrAdmin =
    currentUser.systemRole === SystemRole.ADMIN ||
    project.projectLeadId === currentUser.id;

  const members = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    employeeId: m.user.employeeId,
    position: m.user.position,
  }));

  return (
    <div className="space-y-4">
      <ProjectChatView
        projectId={project.id}
        projectName={project.name}
        projectCode={project.projectCode}
        currentUserId={currentUser.id}
        isLeadOrAdmin={isLeadOrAdmin}
        initialMessages={rawMessages}
        members={members}
      />
    </div>
  );
}
