"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import {
  requireActiveUser,
  requireProjectManage,
  canUpdateTask,
  isAllowedStatusTransition,
  canViewProject,
} from "@/server/auth/authorization";
import { generateNextTaskCode } from "./code-generator";
import {
  TaskStatus,
  Priority,
  NotificationType,
  SystemRole,
  AccountStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2, "Task title must be at least 2 characters").trim(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  milestoneId: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedMinutes: z.coerce.number().optional(),
});

export interface CreateTaskResult {
  error?: string;
  success?: boolean;
  taskId?: string;
  taskCode?: string;
}

export async function createTaskAction(
  _prevState: CreateTaskResult | undefined,
  formData: FormData,
): Promise<CreateTaskResult> {
  const projectId = formData.get("projectId") as string;
  if (!projectId) {
    return { error: "Project ID is required." };
  }

  const actor = await requireProjectManage(projectId);

  const raw = {
    projectId,
    title: formData.get("title"),
    description: formData.get("description") || "",
    assigneeId: formData.get("assigneeId") || "",
    milestoneId: formData.get("milestoneId") || "",
    priority: (formData.get("priority") as Priority) || Priority.MEDIUM,
    status: (formData.get("status") as TaskStatus) || TaskStatus.TODO,
    startDate: formData.get("startDate") || "",
    dueDate: formData.get("dueDate") || "",
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid task input." };
  }

  const {
    title,
    description,
    assigneeId,
    milestoneId,
    priority,
    status,
    startDate,
    dueDate,
    estimatedMinutes,
  } = parsed.data;

  // If assignee provided, verify they are an active member of this project
  if (assigneeId) {
    const member = await db.projectMember.findFirst({
      where: {
        projectId,
        userId: assigneeId,
        removedAt: null,
        user: { accountStatus: AccountStatus.ACTIVE },
      },
      include: { user: true },
    });

    if (!member) {
      return { error: "Assignee must be an active member of this project." };
    }
  }

  const startParsed = startDate ? new Date(startDate) : null;
  const dueParsed = dueDate ? new Date(dueDate) : null;

  if (startParsed && dueParsed && dueParsed < startParsed) {
    return { error: "Due date cannot be earlier than start date." };
  }

  let task = null;
  let attempts = 0;
  while (!task && attempts < 5) {
    attempts++;
    const taskCode = await generateNextTaskCode(projectId);

    try {
      task = await db.$transaction(async (tx) => {
        const newTask = await tx.task.create({
          data: {
            taskCode,
            projectId,
            title,
            description: description || null,
            assigneeId: assigneeId || null,
            milestoneId: milestoneId || null,
            priority,
            status,
            startDate: startParsed,
            dueDate: dueParsed,
            estimatedMinutes: estimatedMinutes || null,
            createdById: actor.id,
          },
          include: {
            project: {
              select: { name: true, projectCode: true, projectLeadId: true },
            },
          },
        });

        // Record initial update
        await tx.taskUpdate.create({
          data: {
            taskId: newTask.id,
            userId: actor.id,
            newStatus: status,
            newProgress: 0,
            note: "Task created",
          },
        });

        // Notification if assigned
        if (assigneeId && assigneeId !== actor.id) {
          await tx.notification.create({
            data: {
              userId: assigneeId,
              type: NotificationType.TASK_ASSIGNED,
              title: "New Task Assigned",
              message: `You were assigned "${newTask.title}" [${newTask.taskCode}] in ${newTask.project.name}.`,
              projectId,
              entityType: "Task",
              entityId: newTask.id,
            },
          });
        }

        // Activity log
        await tx.activityLog.create({
          data: {
            actorId: actor.id,
            action: "TASK_CREATED",
            entityType: "Task",
            entityId: newTask.id,
            metadata: {
              taskCode: newTask.taskCode,
              title: newTask.title,
              projectId,
              assigneeId: assigneeId || null,
            },
          },
        });

        return newTask;
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "P2002" && attempts < 5) {
        await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
        continue;
      }
      throw err;
    }
  }

  if (!task) {
    return {
      error: "Failed to generate a unique task code. Please try again.",
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath("/my-tasks");

  return {
    success: true,
    taskId: task.id,
    taskCode: task.taskCode,
  };
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus,
  progress?: number,
  blockerReason?: string,
  note?: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireActiveUser();

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectLeadId: true,
          projectCode: true,
        },
      },
    },
  });

  if (!task) {
    return { success: false, error: "Task not found." };
  }

  const isLeadOrAdmin =
    actor.systemRole === SystemRole.ADMIN ||
    task.project.projectLeadId === actor.id;
  const isAssignee = task.assigneeId === actor.id;

  if (!isLeadOrAdmin && !isAssignee) {
    return {
      success: false,
      error: "You do not have permission to update this task.",
    };
  }

  // Check state transition rules
  const allowed = isAllowedStatusTransition(
    actor.systemRole,
    isLeadOrAdmin,
    isAssignee,
    task.status,
    newStatus,
  );

  if (!allowed) {
    return {
      success: false,
      error: `Status transition from ${task.status} to ${newStatus} is not permitted for your role.`,
    };
  }

  if (
    newStatus === TaskStatus.BLOCKED &&
    !blockerReason?.trim() &&
    !task.blockerReason
  ) {
    return {
      success: false,
      error: "A reason must be provided when marking a task as BLOCKED.",
    };
  }

  // Adjust progress if transitioning to COMPLETED or starting
  let targetProgress = progress !== undefined ? progress : task.progress;
  if (newStatus === TaskStatus.COMPLETED) {
    targetProgress = 100;
  } else if (newStatus === TaskStatus.IN_PROGRESS && targetProgress === 0) {
    targetProgress = 10;
  }

  await db.$transaction(async (tx) => {
    const updateData: {
      status: TaskStatus;
      progress: number;
      blockerReason: string | null;
      submittedForReviewAt?: Date | null;
      completedAt?: Date | null;
    } = {
      status: newStatus,
      progress: targetProgress,
      blockerReason:
        newStatus === TaskStatus.BLOCKED
          ? blockerReason || task.blockerReason
          : null,
    };

    if (newStatus === TaskStatus.IN_REVIEW) {
      updateData.submittedForReviewAt = new Date();
    } else if (newStatus === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (task.status === TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    await tx.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Record history update
    await tx.taskUpdate.create({
      data: {
        taskId,
        userId: actor.id,
        previousStatus: task.status,
        newStatus,
        previousProgress: task.progress,
        newProgress: targetProgress,
        blockerReason: newStatus === TaskStatus.BLOCKED ? blockerReason : null,
        note: note || `Status changed to ${newStatus}`,
      },
    });

    // Notify Project Lead if submitted for review
    if (newStatus === TaskStatus.IN_REVIEW && task.project.projectLeadId) {
      await tx.notification.create({
        data: {
          userId: task.project.projectLeadId,
          type: NotificationType.TASK_REVIEW_REQUESTED,
          title: "Task Review Requested",
          message: `${actor.name} submitted "${task.title}" [${task.taskCode}] for review.`,
          projectId: task.projectId,
          entityType: "Task",
          entityId: taskId,
        },
      });
    }

    // Notify Assignee if Lead reviewed
    if (isLeadOrAdmin && task.assigneeId && task.assigneeId !== actor.id) {
      if (newStatus === TaskStatus.COMPLETED) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_REVIEWED,
            title: "Task Approved",
            message: `Your task "${task.title}" was approved and marked Completed.`,
            projectId: task.projectId,
            entityType: "Task",
            entityId: taskId,
          },
        });
      } else if (
        task.status === TaskStatus.IN_REVIEW &&
        newStatus === TaskStatus.IN_PROGRESS
      ) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_REVIEWED,
            title: "Changes Requested",
            message: `Changes were requested on "${task.title}".`,
            projectId: task.projectId,
            entityType: "Task",
            entityId: taskId,
          },
        });
      }
    }

    // Audit log
    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: "TASK_STATUS_CHANGED",
        entityType: "Task",
        entityId: taskId,
        metadata: {
          taskCode: task.taskCode,
          oldStatus: task.status,
          newStatus,
          progress: targetProgress,
        },
      },
    });
  });

  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath("/my-tasks");
  revalidatePath("/upcoming");

  return { success: true };
}

export async function reassignTaskAction(
  taskId: string,
  newAssigneeId: string,
): Promise<{ success: boolean; error?: string }> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectLeadId: true,
          projectCode: true,
        },
      },
    },
  });

  if (!task) {
    return { success: false, error: "Task not found." };
  }

  const actor = await requireProjectManage(task.projectId);

  // Verify new assignee is an active project member
  const member = await db.projectMember.findFirst({
    where: {
      projectId: task.projectId,
      userId: newAssigneeId,
      removedAt: null,
      user: { accountStatus: AccountStatus.ACTIVE },
    },
    include: { user: true },
  });

  if (!member) {
    return {
      success: false,
      error: "New assignee must be an active project member.",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { assigneeId: newAssigneeId },
    });

    await tx.taskUpdate.create({
      data: {
        taskId,
        userId: actor.id,
        note: `Reassigned to ${member.user.name} (${member.user.employeeId})`,
      },
    });

    // Notify new assignee
    if (newAssigneeId !== actor.id) {
      await tx.notification.create({
        data: {
          userId: newAssigneeId,
          type: NotificationType.TASK_REASSIGNED,
          title: "Task Reassigned to You",
          message: `You were assigned "${task.title}" [${task.taskCode}] in ${task.project.name}.`,
          projectId: task.projectId,
          entityType: "Task",
          entityId: taskId,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: "TASK_REASSIGNED",
        entityType: "Task",
        entityId: taskId,
        metadata: {
          previousAssigneeId: task.assigneeId,
          newAssigneeId,
          taskCode: task.taskCode,
        },
      },
    });
  });

  revalidatePath(`/projects/${task.projectId}/tasks`);
  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  revalidatePath("/my-tasks");

  return { success: true };
}

export async function createSubtaskAction(
  taskId: string,
  title: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireActiveUser();
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: "Subtask title cannot be empty." };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });
  if (!task) return { success: false, error: "Task not found." };

  const canEdit = await canUpdateTask(actor.id, taskId);
  if (!canEdit) {
    return { success: false, error: "Permission denied." };
  }

  await db.$transaction(async (tx) => {
    const count = await tx.subtask.count({ where: { taskId } });

    await tx.subtask.create({
      data: {
        taskId,
        title: trimmed,
        sortOrder: count + 1,
      },
    });

    const allSubtasks = await tx.subtask.findMany({
      where: { taskId },
      select: { isCompleted: true },
    });

    if (allSubtasks.length > 0) {
      const completed = allSubtasks.filter((s) => s.isCompleted).length;
      const progressPercent = Math.round(
        (completed / allSubtasks.length) * 100,
      );

      await tx.task.update({
        where: { id: taskId },
        data: { progress: progressPercent },
      });
    }
  });

  revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
  return { success: true };
}

export async function toggleSubtaskAction(
  subtaskId: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireActiveUser();

  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { select: { id: true, projectId: true } } },
  });

  if (!subtask) return { success: false, error: "Subtask not found." };

  const canEdit = await canUpdateTask(actor.id, subtask.taskId);
  if (!canEdit) {
    return { success: false, error: "Permission denied." };
  }

  const willBeCompleted = !subtask.isCompleted;

  await db.$transaction(async (tx) => {
    await tx.subtask.update({
      where: { id: subtaskId },
      data: {
        isCompleted: willBeCompleted,
        completedAt: willBeCompleted ? new Date() : null,
      },
    });

    // Auto-update overall task progress based on subtasks
    const allSubtasks = await tx.subtask.findMany({
      where: { taskId: subtask.taskId },
      select: { isCompleted: true },
    });

    if (allSubtasks.length > 0) {
      const completed = allSubtasks.filter((s) => s.isCompleted).length;
      const progressPercent = Math.round(
        (completed / allSubtasks.length) * 100,
      );

      await tx.task.update({
        where: { id: subtask.taskId },
        data: { progress: progressPercent },
      });
    }
  });

  revalidatePath(`/projects/${subtask.task.projectId}/tasks/${subtask.taskId}`);
  revalidatePath(`/projects/${subtask.task.projectId}/tasks`);
  revalidatePath("/my-tasks");

  return { success: true };
}

export async function deleteSubtaskAction(
  subtaskId: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireActiveUser();

  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { select: { id: true, projectId: true } } },
  });

  if (!subtask) return { success: false, error: "Subtask not found." };

  const canEdit = await canUpdateTask(actor.id, subtask.taskId);
  if (!canEdit) {
    return { success: false, error: "Permission denied." };
  }

  await db.$transaction(async (tx) => {
    await tx.subtask.delete({ where: { id: subtaskId } });

    const allSubtasks = await tx.subtask.findMany({
      where: { taskId: subtask.taskId },
      select: { isCompleted: true },
    });

    if (allSubtasks.length > 0) {
      const completed = allSubtasks.filter((s) => s.isCompleted).length;
      const progressPercent = Math.round(
        (completed / allSubtasks.length) * 100,
      );

      await tx.task.update({
        where: { id: subtask.taskId },
        data: { progress: progressPercent },
      });
    } else {
      await tx.task.update({
        where: { id: subtask.taskId },
        data: { progress: 0 },
      });
    }
  });

  revalidatePath(`/projects/${subtask.task.projectId}/tasks/${subtask.taskId}`);
  return { success: true };
}

export async function getTaskDetailsAction(taskId: string) {
  const user = await requireActiveUser();
  const task = await db.task.findUnique({
    where: { id: taskId, archivedAt: null },
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
        select: { id: true, name: true, employeeId: true, position: true },
      },
      subtasks: { orderBy: { sortOrder: "asc" } },
      comments: {
        where: { deletedAt: null },
        include: {
          user: {
            select: { id: true, name: true, employeeId: true, position: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return null;

  const hasAccess = await canViewProject(user.id, task.projectId);
  if (!hasAccess) return null;

  const isLeadOrAdmin =
    user.systemRole === SystemRole.ADMIN ||
    task.project.projectLeadId === user.id;
  const canEdit = isLeadOrAdmin || task.assigneeId === user.id;

  return {
    task,
    currentUserId: user.id,
    isLeadOrAdmin,
    canEdit,
  };
}

export async function toggleTaskPointerAction(taskId: string) {
  try {
    const user = await requireActiveUser();
    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      select: { id: true, projectId: true, isPointed: true },
    });

    if (!task) return { error: "Task not found." };

    const hasAccess = await canViewProject(user.id, task.projectId);
    if (!hasAccess) return { error: "Unauthorized." };

    const willPoint = !task.isPointed;

    await db.$transaction(async (tx) => {
      if (willPoint) {
        // Clear pointer on any other task in the project
        await tx.task.updateMany({
          where: { projectId: task.projectId, isPointed: true },
          data: { isPointed: false, pointedAt: null },
        });

        // Set pointer on this task
        await tx.task.update({
          where: { id: taskId },
          data: { isPointed: true, pointedAt: new Date() },
        });
      } else {
        await tx.task.update({
          where: { id: taskId },
          data: { isPointed: false, pointedAt: null },
        });
      }
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/projects/${task.projectId}/tasks`);
    revalidatePath(`/projects/${task.projectId}/board`);
    revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);

    return { success: true, isPointed: willPoint };
  } catch (error) {
    console.error("toggleTaskPointerAction error:", error);
    return { error: "Failed to toggle pointer." };
  }
}

export async function setTaskHighlightAction(
  taskId: string,
  highlightColor: string | null,
) {
  try {
    const user = await requireActiveUser();
    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      select: { id: true, projectId: true },
    });

    if (!task) return { error: "Task not found." };

    const hasAccess = await canViewProject(user.id, task.projectId);
    if (!hasAccess) return { error: "Unauthorized." };

    const allowed = ["YELLOW", "RED", "PURPLE", "BLUE", "GREEN", null];
    const color = allowed.includes(highlightColor) ? highlightColor : null;

    await db.task.update({
      where: { id: taskId },
      data: { highlightColor: color },
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/projects/${task.projectId}/tasks`);
    revalidatePath(`/projects/${task.projectId}/board`);
    revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);

    return { success: true, highlightColor: color };
  } catch (error) {
    console.error("setTaskHighlightAction error:", error);
    return { error: "Failed to update highlight color." };
  }
}
