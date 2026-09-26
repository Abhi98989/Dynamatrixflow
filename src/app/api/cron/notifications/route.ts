import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { TaskStatus, NotificationType } from '@prisma/client';
import { addDays, startOfDay } from '@/lib/utils/date';

export async function GET(request: Request) {
  // In a real application, you should verify a secret or token here to ensure
  // this endpoint is only called by a trusted cron scheduler (e.g. Vercel Cron, Google Cloud Scheduler)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = startOfDay(new Date());
    const soonThreshold = addDays(today, 3); // Due in 3 days or less

    // 1. Process Tasks Due Soon
    const dueSoonTasks = await db.task.findMany({
      where: {
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: {
          gte: today,
          lte: soonThreshold,
        },
        assigneeId: { not: null },
      },
      select: { id: true, title: true, taskCode: true, projectId: true, assigneeId: true, dueDate: true }
    });

    // 2. Process Overdue Tasks
    const overdueTasks = await db.task.findMany({
      where: {
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        dueDate: {
          lt: today,
        },
        assigneeId: { not: null },
      },
      select: { id: true, title: true, taskCode: true, projectId: true, assigneeId: true, dueDate: true }
    });

    let notificationsCreated = 0;

    await db.$transaction(async (tx) => {
      // Due Soon notifications (only if we haven't already notified them for being due soon recently, ideally.
      // For MVP, we might create duplicates if run daily, so usually we'd add a flag on the task like `notifiedDueSoonAt`)
      // For MVP, we will assume it's acceptable or we just create them. Let's just create them for demonstration.
      for (const task of dueSoonTasks) {
        if (!task.assigneeId) continue;
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_DUE_SOON,
            title: 'Task Due Soon',
            message: `Task "${task.title}" [${task.taskCode}] is due on ${task.dueDate?.toLocaleDateString("en-US")}.`,
            projectId: task.projectId,
            entityType: 'Task',
            entityId: task.id,
          }
        });
        notificationsCreated++;
      }

      for (const task of overdueTasks) {
        if (!task.assigneeId) continue;
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue',
            message: `Task "${task.title}" [${task.taskCode}] was due on ${task.dueDate?.toLocaleDateString("en-US")} and is now overdue.`,
            projectId: task.projectId,
            entityType: 'Task',
            entityId: task.id,
          }
        });
        notificationsCreated++;
      }
    });

    return NextResponse.json({ success: true, notificationsCreated });
  } catch (error: unknown) {
    console.error('Cron job error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
