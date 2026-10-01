import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { WorkspaceChatView, ProjectGroup } from "@/features/chat/workspace-chat-view";
import { SystemRole } from "@prisma/client";

interface Props {
  searchParams: Promise<{ project?: string }>;
}

export const dynamic = "force-dynamic";

export default async function WorkspaceChatPage({ searchParams }: Props) {
  const currentUser = await requireActiveUser();
  const { project: queryProjectId } = await searchParams;

  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  // Fetch all accessible projects for this user
  // Every accessible project automatically serves as a chat group
  const rawProjects = await db.project.findMany({
    where: {
      status: { not: "ARCHIVED" },
      ...(isAdmin
        ? {}
        : {
            OR: [
              { projectLeadId: currentUser.id },
              {
                members: {
                  some: {
                    userId: currentUser.id,
                    removedAt: null,
                  },
                },
              },
            ],
          }),
    },
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
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
              systemRole: true,
              avatarUrl: true,
            },
          },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
      _count: {
        select: {
          messages: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedProjects: ProjectGroup[] = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    projectCode: p.projectCode,
    status: p.status,
    projectLeadId: p.projectLeadId,
    messageCount: p._count.messages,
    lastMessage: p.messages[0]
      ? {
          content: p.messages[0].content,
          createdAt: p.messages[0].createdAt,
          senderName: p.messages[0].user.name,
        }
      : null,
    members: p.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      employeeId: m.user.employeeId,
      position: m.user.position,
      projectRole: m.projectRole as string,
      isLead: m.user.id === p.projectLeadId,
      avatarUrl: m.user.avatarUrl,
    })),
  }));

  // Resolve active project
  const activeProjectId =
    (queryProjectId &&
      formattedProjects.find((p) => p.id === queryProjectId)?.id) ||
    formattedProjects[0]?.id ||
    "";

  // Load initial messages for active project
  const rawMessages = activeProjectId
    ? await db.projectMessage.findMany({
        where: { projectId: activeProjectId, deletedAt: null },
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
      })
    : [];

  return (
    <WorkspaceChatView
      projects={formattedProjects}
      activeProjectId={activeProjectId}
      currentUserId={currentUser.id}
      isAdmin={isAdmin}
      initialMessages={rawMessages}
    />
  );
}
