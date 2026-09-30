"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { NotificationType, SystemRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment is too long")
    .trim(),
});

export async function createTaskCommentAction(taskId: string, content: string) {
  try {
    const user = await requireActiveUser();
    const validated = createCommentSchema.safeParse({ taskId, content });
    if (!validated.success) {
      return {
        error: validated.error.issues[0]?.message || "Invalid comment.",
      };
    }

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      select: {
        id: true,
        taskCode: true,
        title: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
            id: true,
            name: true,
            projectLeadId: true,
          },
        },
      },
    });

    if (!task) return { error: "Task not found or archived." };

    if ((user.systemRole as string) === "GUEST") {
      return {
        error:
          "Guest observers have read-only privileges and cannot post comments.",
      };
    }

    const hasAccess = await canViewProject(user.id, task.projectId);
    if (!hasAccess) {
      return { error: "You do not have access to comment on this task." };
    }

    const cleanContent = validated.data.content;

    const comment = await db.$transaction(async (tx) => {
      // 1. Create comment
      const newComment = await tx.taskComment.create({
        data: {
          taskId,
          userId: user.id,
          content: cleanContent,
        },
      });

      // 2. Identify notification recipients (assignee + lead, avoiding duplicates & self)
      const recipientIds = new Set<string>();
      if (task.assigneeId && task.assigneeId !== user.id) {
        recipientIds.add(task.assigneeId);
      }
      if (
        task.project.projectLeadId &&
        task.project.projectLeadId !== user.id
      ) {
        recipientIds.add(task.project.projectLeadId);
      }

      for (const recipientId of recipientIds) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            type: NotificationType.TASK_COMMENT,
            title: `New Comment: [${task.taskCode}]`,
            message: `${user.name}: ${cleanContent.slice(0, 100)}`,
            projectId: task.projectId,
            entityType: "TASK",
            entityId: task.id,
          },
        });
      }

      // 3. Activity log
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: task.projectId,
          action: "TASK_COMMENT_CREATED",
          entityType: "TASK",
          entityId: task.id,
          metadata: {
            taskCode: task.taskCode,
            taskTitle: task.title,
            commentId: newComment.id,
            commentPreview: cleanContent.slice(0, 160),
          },
        },
      });

      return newComment;
    });

    revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.projectId}/activity`);
    revalidatePath(`/projects/${task.projectId}`);
    return { success: true, commentId: comment.id };
  } catch (error) {
    console.error("createTaskCommentAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to post comment.",
    };
  }
}

export async function deleteTaskCommentAction(commentId: string) {
  try {
    const user = await requireActiveUser();

    const comment = await db.taskComment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
            project: {
              select: {
                projectLeadId: true,
              },
            },
          },
        },
      },
    });

    if (!comment || comment.deletedAt) {
      return { error: "Comment not found or already deleted." };
    }

    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const isAuthor = comment.userId === user.id;
    const isLead = comment.task.project.projectLeadId === user.id;

    if (!isAdmin && !isAuthor && !isLead) {
      return { error: "You do not have permission to delete this comment." };
    }

    await db.taskComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(
      `/projects/${comment.task.projectId}/tasks/${comment.task.id}`,
    );
    return { success: true };
  } catch (error) {
    console.error("deleteTaskCommentAction error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete comment.",
    };
  }
}
