"use server";

import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";

export interface SendMessageInput {
  projectId: string;
  content: string;
  replyToId?: string;
  mentionedUserIds?: string[];
}

export async function sendProjectMessageAction({
  projectId,
  content,
  replyToId,
  mentionedUserIds = [],
}: SendMessageInput) {
  try {
    const user = await requireActiveUser();
    const hasAccess = await canViewProject(user.id, projectId);
    if (!hasAccess) {
      return { error: "You do not have access to this project." };
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return { error: "Message cannot be empty." };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });
    if (!project) {
      return { error: "Project not found." };
    }

    // Auto-detect any @mentions if not explicitly passed
    const finalMentions = [...mentionedUserIds];
    if (finalMentions.length === 0 && trimmed.includes("@")) {
      const projectMembers = await db.projectMember.findMany({
        where: { projectId, removedAt: null },
        include: {
          user: { select: { id: true, name: true, employeeId: true } },
        },
      });

      for (const member of projectMembers) {
        const u = member.user;
        if (
          trimmed.includes(`@${u.name}`) ||
          trimmed.includes(`@${u.employeeId}`) ||
          trimmed.toLowerCase().includes(`@${u.name.toLowerCase()}`)
        ) {
          if (!finalMentions.includes(u.id) && u.id !== user.id) {
            finalMentions.push(u.id);
          }
        }
      }
    }

    // Create the message
    const message = await db.projectMessage.create({
      data: {
        projectId,
        userId: user.id,
        content: trimmed,
        replyToId: replyToId || null,
        mentions: finalMentions,
      },
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
            user: { select: { id: true, name: true, employeeId: true } },
          },
        },
      },
    });

    // Send notifications to mentioned users
    if (finalMentions.length > 0) {
      const mentionNotifications = finalMentions
        .filter((uid) => uid !== user.id)
        .map((targetUserId) => ({
          userId: targetUserId,
          type: NotificationType.PROJECT_UPDATE,
          title: `Mentioned in ${project.name}`,
          message: `${user.name}: "${trimmed.slice(0, 90)}"`,
          projectId,
          entityType: "PROJECT_MESSAGE",
          entityId: message.id,
        }));

      if (mentionNotifications.length > 0) {
        await db.notification.createMany({
          data: mentionNotifications,
        });
      }
    }

    revalidatePath(`/projects/${projectId}/chat`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/chat");
    return { success: true, message };
  } catch (error) {
    console.error("sendProjectMessageAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to send message.",
    };
  }
}

export async function getProjectMessagesAction(projectId: string, take = 100) {
  try {
    const user = await requireActiveUser();
    const hasAccess = await canViewProject(user.id, projectId);
    if (!hasAccess) {
      return { error: "Unauthorized", messages: [] };
    }

    const messages = await db.projectMessage.findMany({
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
            user: { select: { id: true, name: true, employeeId: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take,
    });

    return { success: true, messages };
  } catch (error) {
    console.error("getProjectMessagesAction error:", error);
    return { error: "Failed to fetch messages.", messages: [] };
  }
}

export async function deleteProjectMessageAction(
  projectId: string,
  messageId: string,
) {
  try {
    const user = await requireActiveUser();
    const message = await db.projectMessage.findUnique({
      where: { id: messageId },
      include: { project: { select: { projectLeadId: true } } },
    });

    if (!message || message.projectId !== projectId) {
      return { error: "Message not found." };
    }

    const isAdmin = (user.systemRole as string) === "ADMIN";
    const isLead = message.project.projectLeadId === user.id;
    const isAuthor = message.userId === user.id;

    if (!isAuthor && !isLead && !isAdmin) {
      return { error: "You do not have permission to delete this message." };
    }

    await db.projectMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/projects/${projectId}/chat`);
    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("deleteProjectMessageAction error:", error);
    return { error: "Failed to delete message." };
  }
}

export async function togglePinProjectMessageAction(
  projectId: string,
  messageId: string,
) {
  try {
    const user = await requireActiveUser();
    const hasAccess = await canViewProject(user.id, projectId);
    if (!hasAccess) {
      return { error: "Unauthorized." };
    }

    const message = await db.projectMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.projectId !== projectId) {
      return { error: "Message not found." };
    }

    const updated = await db.projectMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
    });

    revalidatePath(`/projects/${projectId}/chat`);
    revalidatePath("/chat");
    return { success: true, isPinned: updated.isPinned };
  } catch (error) {
    console.error("togglePinProjectMessageAction error:", error);
    return { error: "Failed to pin message." };
  }
}
