'use server';

import { z } from 'zod';
import { db } from '@/server/db/client';
import {
  requireActiveUser,
  requireProjectManage,
  canUpdateTask,
} from '@/server/auth/authorization';
import { generateNextMilestoneCode } from './code-generator';
import { MilestoneStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const progressOverrideSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    return Math.min(100, Math.max(0, Math.round(num)));
  });

const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2, 'Milestone name must be at least 2 characters').trim(),
  description: z.string().optional(),
  status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.PLANNED),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  progressOverride: progressOverrideSchema,
});

const updateMilestoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Milestone name must be at least 2 characters').trim(),
  description: z.string().optional(),
  status: z.nativeEnum(MilestoneStatus),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  progressOverride: progressOverrideSchema,
});

export async function createMilestoneAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await requireActiveUser();
    const raw = Object.fromEntries(formData.entries());
    const validated = createMilestoneSchema.safeParse(raw);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid milestone input.' };
    }

    const { projectId, name, description, status, startDate, deadline, progressOverride } =
      validated.data;

    await requireProjectManage(projectId);

    const startParsed = startDate ? new Date(startDate) : null;
    const deadlineParsed = deadline ? new Date(deadline) : null;

    if (startParsed && deadlineParsed && deadlineParsed < startParsed) {
      return { error: 'Deadline cannot be earlier than start date.' };
    }

    const milestoneCode = await generateNextMilestoneCode(projectId);

    const milestone = await db.$transaction(async (tx) => {
      const created = await tx.milestone.create({
        data: {
          milestoneCode,
          projectId,
          name,
          description: description || null,
          status,
          startDate: startParsed,
          deadline: deadlineParsed,
          progressOverride: typeof progressOverride === 'number' && !Number.isNaN(progressOverride) ? progressOverride : null,
          createdById: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId,
          action: 'MILESTONE_CREATED',
          entityType: 'Milestone',
          entityId: created.id,
          metadata: {
            milestoneCode: created.milestoneCode,
            name: created.name,
          },
        },
      });

      return created;
    });

    revalidatePath(`/projects/${projectId}/milestones`);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, milestoneId: milestone.id };
  } catch (error) {
    console.error('createMilestoneAction error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create milestone.' };
  }
}

export async function updateMilestoneAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await requireActiveUser();
    const raw = Object.fromEntries(formData.entries());
    const validated = updateMilestoneSchema.safeParse(raw);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid milestone input.' };
    }

    const { id, name, description, status, startDate, deadline, progressOverride } =
      validated.data;

    const existing = await db.milestone.findUnique({
      where: { id, archivedAt: null },
      select: { projectId: true },
    });

    if (!existing) return { error: 'Milestone not found or archived.' };

    await requireProjectManage(existing.projectId);

    const startParsed = startDate ? new Date(startDate) : null;
    const deadlineParsed = deadline ? new Date(deadline) : null;

    if (startParsed && deadlineParsed && deadlineParsed < startParsed) {
      return { error: 'Deadline cannot be earlier than start date.' };
    }

    await db.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id },
        data: {
          name,
          description: description || null,
          status,
          startDate: startParsed,
          deadline: deadlineParsed,
          progressOverride: typeof progressOverride === 'number' && !Number.isNaN(progressOverride) ? progressOverride : null,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: existing.projectId,
          action: 'MILESTONE_UPDATED',
          entityType: 'Milestone',
          entityId: id,
          metadata: { name, status },
        },
      });
    });

    revalidatePath(`/projects/${existing.projectId}/milestones`);
    revalidatePath(`/projects/${existing.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('updateMilestoneAction error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update milestone.' };
  }
}

export async function archiveMilestoneAction(milestoneId: string) {
  try {
    const user = await requireActiveUser();
    const milestone = await db.milestone.findUnique({
      where: { id: milestoneId, archivedAt: null },
      select: { projectId: true, name: true, milestoneCode: true },
    });

    if (!milestone) return { error: 'Milestone not found or already archived.' };

    await requireProjectManage(milestone.projectId);

    await db.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id: milestoneId },
        data: { archivedAt: new Date() },
      });

      // Unlink any tasks linked to this milestone
      await tx.task.updateMany({
        where: { milestoneId },
        data: { milestoneId: null },
      });

      await tx.activityLog.create({
        data: {
          actorId: user.id,
          projectId: milestone.projectId,
          action: 'MILESTONE_ARCHIVED',
          entityType: 'Milestone',
          entityId: milestoneId,
          metadata: {
            milestoneCode: milestone.milestoneCode,
            name: milestone.name,
          },
        },
      });
    });

    revalidatePath(`/projects/${milestone.projectId}/milestones`);
    revalidatePath(`/projects/${milestone.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('archiveMilestoneAction error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to archive milestone.' };
  }
}

export async function linkTaskToMilestoneAction(taskId: string, milestoneId: string | null) {
  try {
    const user = await requireActiveUser();

    const task = await db.task.findUnique({
      where: { id: taskId, archivedAt: null },
      select: { projectId: true },
    });

    if (!task) return { error: 'Task not found or archived.' };

    const canEdit = await canUpdateTask(user.id, taskId);
    if (!canEdit) {
      return { error: 'You do not have permission to modify this task.' };
    }

    if (milestoneId) {
      const milestone = await db.milestone.findUnique({
        where: { id: milestoneId, projectId: task.projectId, archivedAt: null },
      });
      if (!milestone) return { error: 'Selected milestone does not belong to this project.' };
    }

    await db.task.update({
      where: { id: taskId },
      data: { milestoneId },
    });

    revalidatePath(`/projects/${task.projectId}/tasks/${taskId}`);
    revalidatePath(`/projects/${task.projectId}/tasks`);
    revalidatePath(`/projects/${task.projectId}/board`);
    revalidatePath(`/projects/${task.projectId}/milestones`);
    return { success: true };
  } catch (error) {
    console.error('linkTaskToMilestoneAction error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to link milestone.' };
  }
}
