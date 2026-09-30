"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { TaskStatus, NotificationType, SystemRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const requestChangesSchema = z.object({
  taskId: z.string().min(1),
  feedback: z
    .string()
    .min(3, "Feedback must be at least 3 characters long")
    .trim(),
});

const reopenTaskSchema = z.object({
  taskId: z.string().min(1),
  reopenReason: z
    .string()
    .min(
      5,
      "A clear reason of at least 5 characters is required to reopen a completed deliverable",
    )
    .trim(),
});

/**
 * Submit a task for review.
 * Allowed for: Assignee, Project Lead, Admin.
 */
export async function submitForReviewAction(taskId: string, note?: string) {
  try {
    const user = await requireActiveUser();

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      include: {
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

    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const isLead = task.project.projectLeadId === user.id;
    const isAssignee = task.assigneeId === user.id;

    if (!isAdmin && !isLead && !isAssignee) {
      return {
        error:
          "You do not have permission to submit this deliverable for review.",
      };
    }

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.CANCELLED
    ) {
      return {
        error: `Cannot submit a ${task.status.toLowerCase()} task for review.`,
      };
    }

    const previousStatus = task.status;
    const submissionNote = note?.trim()
      ? `Submitted for review: ${note.trim()}`
      : "Submitted for review by assignee.";

    await db.$transaction(async (tx) => {
      // 1. Update task status
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.IN_REVIEW,
          submittedForReviewAt: new Date(),
        },
      });

      // 2. Add TaskUpdate
      await tx.taskUpdate.create({
        data: {
          taskId,
          userId: user.id,
          previousStatus,
          newStatus: TaskStatus.IN_REVIEW,
          previousProgress: task.progress,
          newProgress: task.progress,
          note: submissionNote,
        },
      });

      // 3. Notify Project Lead (if not the one submitting)
      const recipientId = task.project.projectLeadId;
      if (recipientId && recipientId !== user.id) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            type: NotificationType.TASK_REVIEW_REQUESTED,
            title: `Review Requested: [${task.taskCode}]`,
            message: `${user.name} submitted "${task.title}" for review.`,
            projectId: task.project.id,
            entityType: "TASK",
            entityId: task.id,
          },
        });
      }

      // 4. Activity log
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: task.project.id,
          action: "TASK_SUBMITTED_FOR_REVIEW",
          entityType: "TASK",
          entityId: task.id,
          metadata: {
            taskCode: task.taskCode,
            taskTitle: task.title,
            previousStatus,
            note: submissionNote,
          },
        },
      });
    });

    revalidatePath(`/projects/${task.project.id}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.project.id}/tasks`);
    revalidatePath("/review");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error) {
    console.error("submitForReviewAction error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to submit for review.",
    };
  }
}

/**
 * Approve task review -> Set status to COMPLETED.
 * Allowed for: Project Lead of project, Admin. (Assignee cannot approve their own deliverable).
 */
export async function approveTaskReviewAction(
  taskId: string,
  reviewNote?: string,
) {
  try {
    const user = await requireActiveUser();

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      include: {
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

    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const isLead = task.project.projectLeadId === user.id;

    if (!isAdmin && !isLead) {
      return {
        error:
          "Only Project Leads or Administrators can approve deliverable reviews.",
      };
    }

    if (task.status !== TaskStatus.IN_REVIEW) {
      return {
        error: `Task is not pending review (current status: ${task.status}).`,
      };
    }

    const approvalNote = reviewNote?.trim()
      ? `Review Approved: ${reviewNote.trim()}`
      : "Deliverable approved by Project Lead.";

    await db.$transaction(async (tx) => {
      // 1. Mark task completed
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // 2. Add TaskUpdate
      await tx.taskUpdate.create({
        data: {
          taskId,
          userId: user.id,
          previousStatus: TaskStatus.IN_REVIEW,
          newStatus: TaskStatus.COMPLETED,
          previousProgress: task.progress,
          newProgress: 100,
          note: approvalNote,
        },
      });

      // 3. Notify Assignee
      if (task.assigneeId && task.assigneeId !== user.id) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_REVIEWED,
            title: `Deliverable Approved: [${task.taskCode}]`,
            message: `Your deliverable "${task.title}" has been approved by ${user.name}.`,
            projectId: task.project.id,
            entityType: "TASK",
            entityId: task.id,
          },
        });
      }

      // 4. Activity log
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: task.project.id,
          action: "TASK_REVIEW_APPROVED",
          entityType: "TASK",
          entityId: task.id,
          metadata: {
            taskCode: task.taskCode,
            taskTitle: task.title,
            note: approvalNote,
          },
        },
      });
    });

    revalidatePath(`/projects/${task.project.id}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.project.id}/tasks`);
    revalidatePath("/review");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error) {
    console.error("approveTaskReviewAction error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to approve review.",
    };
  }
}

/**
 * Request changes on deliverable -> Returns status to IN_PROGRESS with feedback.
 * Allowed for: Project Lead of project, Admin.
 */
export async function requestChangesAction(taskId: string, feedback: string) {
  try {
    const user = await requireActiveUser();
    const validated = requestChangesSchema.safeParse({ taskId, feedback });
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Invalid input." };
    }

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      include: {
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

    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const isLead = task.project.projectLeadId === user.id;

    if (!isAdmin && !isLead) {
      return {
        error: "Only Project Leads or Administrators can request changes.",
      };
    }

    if (task.status !== TaskStatus.IN_REVIEW) {
      return {
        error: `Task is not pending review (current status: ${task.status}).`,
      };
    }

    const cleanFeedback = validated.data.feedback;
    const noteText = `Changes Requested: ${cleanFeedback}`;

    await db.$transaction(async (tx) => {
      // 1. Return task to IN_PROGRESS
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.IN_PROGRESS,
          submittedForReviewAt: null,
        },
      });

      // 2. Add TaskUpdate
      await tx.taskUpdate.create({
        data: {
          taskId,
          userId: user.id,
          previousStatus: TaskStatus.IN_REVIEW,
          newStatus: TaskStatus.IN_PROGRESS,
          previousProgress: task.progress,
          newProgress: task.progress,
          note: noteText,
        },
      });

      // 3. Post a comment so the feedback is in the discussion thread
      await tx.taskComment.create({
        data: {
          taskId,
          userId: user.id,
          content: `🔄 **Changes Requested by ${user.name}:**\n${cleanFeedback}`,
        },
      });

      // 4. Notify Assignee
      if (task.assigneeId && task.assigneeId !== user.id) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_REVIEWED,
            title: `Changes Requested: [${task.taskCode}]`,
            message: `${user.name} requested changes on "${task.title}": ${cleanFeedback.slice(0, 120)}`,
            projectId: task.project.id,
            entityType: "TASK",
            entityId: task.id,
          },
        });
      }

      // 5. Activity log
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: task.project.id,
          action: "TASK_CHANGES_REQUESTED",
          entityType: "TASK",
          entityId: task.id,
          metadata: {
            taskCode: task.taskCode,
            taskTitle: task.title,
            feedback: cleanFeedback,
          },
        },
      });
    });

    revalidatePath(`/projects/${task.project.id}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.project.id}/tasks`);
    revalidatePath("/review");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error) {
    console.error("requestChangesAction error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to request changes.",
    };
  }
}

/**
 * Reopen a COMPLETED task with a mandatory audit reason.
 * Allowed for: Project Lead of project, Admin.
 */
export async function reopenTaskAction(taskId: string, reopenReason: string) {
  try {
    const user = await requireActiveUser();
    const validated = reopenTaskSchema.safeParse({ taskId, reopenReason });
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Invalid input." };
    }

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      include: {
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

    const isAdmin = user.systemRole === SystemRole.ADMIN;
    const isLead = task.project.projectLeadId === user.id;

    if (!isAdmin && !isLead) {
      return {
        error:
          "Only Project Leads or Administrators can reopen completed deliverables.",
      };
    }

    if (task.status !== TaskStatus.COMPLETED) {
      return {
        error: `Only completed deliverables can be reopened (current status: ${task.status}).`,
      };
    }

    const cleanReason = validated.data.reopenReason;
    const noteText = `Task Reopened: ${cleanReason}`;

    await db.$transaction(async (tx) => {
      // 1. Set task back to IN_PROGRESS
      await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.IN_PROGRESS,
          completedAt: null,
        },
      });

      // 2. Add TaskUpdate
      await tx.taskUpdate.create({
        data: {
          taskId,
          userId: user.id,
          previousStatus: TaskStatus.COMPLETED,
          newStatus: TaskStatus.IN_PROGRESS,
          previousProgress: task.progress,
          newProgress: task.progress,
          note: noteText,
        },
      });

      // 3. Post a comment thread event
      await tx.taskComment.create({
        data: {
          taskId,
          userId: user.id,
          content: `⚠️ **Deliverable Reopened by ${user.name}:**\nReason: ${cleanReason}`,
        },
      });

      // 4. Notify Assignee
      if (task.assigneeId && task.assigneeId !== user.id) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.PROJECT_UPDATE,
            title: `Deliverable Reopened: [${task.taskCode}]`,
            message: `${task.taskCode} was reopened by ${user.name}: ${cleanReason.slice(0, 120)}`,
            projectId: task.project.id,
            entityType: "TASK",
            entityId: task.id,
          },
        });
      }

      // 5. Activity log
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: task.project.id,
          action: "TASK_REOPENED",
          entityType: "TASK",
          entityId: task.id,
          metadata: {
            taskCode: task.taskCode,
            taskTitle: task.title,
            reason: cleanReason,
          },
        },
      });
    });

    revalidatePath(`/projects/${task.project.id}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.project.id}/tasks`);
    revalidatePath("/review");
    revalidatePath("/my-tasks");
    return { success: true };
  } catch (error) {
    console.error("reopenTaskAction error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to reopen task.",
    };
  }
}
