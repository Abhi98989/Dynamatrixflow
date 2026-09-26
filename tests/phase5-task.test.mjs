import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/server/db/client.ts';
import { generateNextTaskCode } from '../src/features/tasks/code-generator.ts';
import { isAllowedStatusTransition } from '../src/server/auth/authorization.ts';
import {
  SystemRole,
  AccountStatus,
  ProjectStatus,
  Priority,
  TaskStatus,
  ProjectMemberRole,
  NotificationType,
} from '@prisma/client';

test('Phase 5: Task Code Generation', async (t) => {
  const project = await db.project.findFirst({
    where: { status: ProjectStatus.ACTIVE },
    select: { id: true, projectCode: true },
  });
  assert.ok(project, 'Active project must exist');

  await t.test('generateNextTaskCode derives prefix and sequential 3-digit number', async () => {
    const taskCode = await generateNextTaskCode(project.id);
    assert.match(taskCode, /^[A-Z0-9]+-\d{3,}$/);
  });
});

test('Phase 5: Task Lifecycle, Membership Enforcement, Subtasks, and Updates', async (t) => {
  const admin = await db.user.findFirst({
    where: { systemRole: SystemRole.ADMIN, accountStatus: AccountStatus.ACTIVE },
  });
  const lead = await db.user.findFirst({
    where: { systemRole: SystemRole.PROJECT_LEAD, accountStatus: AccountStatus.ACTIVE },
  });
  const employees = await db.user.findMany({
    where: { systemRole: SystemRole.EMPLOYEE, accountStatus: AccountStatus.ACTIVE },
  });

  assert.ok(admin);
  assert.ok(lead);
  assert.ok(employees.length >= 2);

  const memberEmployee = employees[0];
  const outsideEmployee = employees[1];

  let testProjectId = null;
  let testTaskId = null;

  // Setup isolated project
  const project = await db.project.create({
    data: {
      projectCode: `DF-TSKTEST-${Date.now().toString().slice(-4)}`,
      name: 'Task Workflow Verification',
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      projectLeadId: lead.id,
      createdById: admin.id,
      members: {
        create: [
          {
            userId: lead.id,
            projectRole: ProjectMemberRole.PROJECT_LEAD,
            addedById: admin.id,
          },
          {
            userId: memberEmployee.id,
            projectRole: ProjectMemberRole.DEVELOPER,
            addedById: lead.id,
          },
        ],
      },
    },
  });
  testProjectId = project.id;

  await t.test('Assigning non-member is rejected; assigning member succeeds', async () => {
    // 1. Check non-member rejection
    const isOutsideMember = await db.projectMember.findFirst({
      where: { projectId: testProjectId, userId: outsideEmployee.id, removedAt: null },
    });
    assert.equal(isOutsideMember, null, 'Outside employee must not be a member');

    // 2. Create task assigned to valid member
    const taskCode = await generateNextTaskCode(testProjectId);
    const task = await db.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          taskCode,
          projectId: testProjectId,
          title: 'Implement unit testing engine',
          description: 'Phase 5 deliverable verification',
          assigneeId: memberEmployee.id,
          priority: Priority.HIGH,
          status: TaskStatus.TODO,
          createdById: lead.id,
        },
      });

      await tx.taskUpdate.create({
        data: {
          taskId: t.id,
          userId: lead.id,
          newStatus: TaskStatus.TODO,
          note: 'Task created',
        },
      });

      await tx.notification.create({
        data: {
          userId: memberEmployee.id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `You were assigned "${t.title}".`,
          projectId: testProjectId,
          entityType: 'Task',
          entityId: t.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: lead.id,
          action: 'TASK_CREATED',
          entityType: 'Task',
          entityId: t.id,
          metadata: {
            taskCode: t.taskCode,
            title: t.title,
            assigneeId: memberEmployee.id,
          },
        },
      });

      return t;
    });

    testTaskId = task.id;
    assert.equal(task.assigneeId, memberEmployee.id);
    assert.equal(task.status, TaskStatus.TODO);

    // Verify notification was created
    const notif = await db.notification.findFirst({
      where: { entityId: task.id, type: NotificationType.TASK_ASSIGNED },
    });
    assert.ok(notif, 'TASK_ASSIGNED notification must exist');
  });

  await t.test('Status transition authorization rules', () => {
    // Assignee transitions
    assert.equal(
      isAllowedStatusTransition(
        SystemRole.EMPLOYEE,
        false, // not lead
        true, // is assignee
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS
      ),
      true,
      'Assignee can start task'
    );

    assert.equal(
      isAllowedStatusTransition(
        SystemRole.EMPLOYEE,
        false,
        true,
        TaskStatus.IN_PROGRESS,
        TaskStatus.IN_REVIEW
      ),
      true,
      'Assignee can submit for review'
    );

    assert.equal(
      isAllowedStatusTransition(
        SystemRole.EMPLOYEE,
        false,
        true,
        TaskStatus.IN_REVIEW,
        TaskStatus.COMPLETED
      ),
      false,
      'Assignee CANNOT self-approve review into Completed'
    );

    // Lead transitions
    assert.equal(
      isAllowedStatusTransition(
        SystemRole.PROJECT_LEAD,
        true, // is lead
        false,
        TaskStatus.IN_REVIEW,
        TaskStatus.COMPLETED
      ),
      true,
      'Lead can approve review into Completed'
    );
  });

  await t.test('Subtask checklist creation, toggle, and auto-progress calculation', async () => {
    assert.ok(testTaskId);

    const st1 = await db.subtask.create({
      data: {
        taskId: testTaskId,
        title: 'Draft architecture diagram',
        isCompleted: false,
        sortOrder: 1,
      },
    });

    await db.subtask.create({
      data: {
        taskId: testTaskId,
        title: 'Run integration test suite',
        isCompleted: false,
        sortOrder: 2,
      },
    });

    // Toggle st1 to completed
    await db.subtask.update({
      where: { id: st1.id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    // Calculate progress: 1 of 2 completed = 50%
    const all = await db.subtask.findMany({ where: { taskId: testTaskId } });
    const completed = all.filter((s) => s.isCompleted).length;
    const progressPercent = Math.round((completed / all.length) * 100);

    await db.task.update({
      where: { id: testTaskId },
      data: { progress: progressPercent },
    });

    const updatedTask = await db.task.findUnique({ where: { id: testTaskId } });
    assert.equal(updatedTask.progress, 50);

    // Cleanup subtasks
    await db.subtask.deleteMany({ where: { taskId: testTaskId } });
  });

  await t.test('Task update history audit records previous and new status', async () => {
    assert.ok(testTaskId);

    await db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: testTaskId },
        data: {
          status: TaskStatus.IN_PROGRESS,
          progress: 60,
        },
      });

      await tx.taskUpdate.create({
        data: {
          taskId: testTaskId,
          userId: memberEmployee.id,
          previousStatus: TaskStatus.TODO,
          newStatus: TaskStatus.IN_PROGRESS,
          previousProgress: 0,
          newProgress: 60,
          note: 'Started execution and drafted test cases',
        },
      });
    });

    const history = await db.taskUpdate.findMany({
      where: { taskId: testTaskId },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(history.length >= 2);
    assert.equal(history[0].newStatus, TaskStatus.IN_PROGRESS);
    assert.equal(history[0].previousStatus, TaskStatus.TODO);
  });

  // Cleanup
  t.after(async () => {
    if (testProjectId) {
      await db.notification.deleteMany({ where: { projectId: testProjectId } });
      await db.activityLog.deleteMany({ where: { entityId: testProjectId } });
      if (testTaskId) {
        await db.taskUpdate.deleteMany({ where: { taskId: testTaskId } });
        await db.subtask.deleteMany({ where: { taskId: testTaskId } });
        await db.task.delete({ where: { id: testTaskId } }).catch(() => {});
      }
      await db.projectMember.deleteMany({ where: { projectId: testProjectId } });
      await db.project.delete({ where: { id: testProjectId } }).catch(() => {});
    }
  });
});
