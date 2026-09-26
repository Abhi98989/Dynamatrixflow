import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/server/db/client.ts';
import { generateNextMilestoneCode } from '../src/features/milestones/code-generator.ts';
import {
  TaskStatus,
  MilestoneStatus,
  ProjectMemberRole,
  Priority,
  SystemRole,
  AccountStatus,
} from '@prisma/client';

test('Phase 7: Kanban, Milestones & Progress Tracking', async (t) => {
  // Ensure test users exist
  const leadUser = await db.user.upsert({
    where: { employeeId: 'DMS-002' },
    update: {},
    create: {
      employeeId: 'DMS-002',
      email: 'ram.sharma@dynamatrix.local',
      name: 'Ram Sharma',
      systemRole: SystemRole.EMPLOYEE,
      passwordHash: 'dummyhash',
      mustChangePassword: false,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  const devUser = await db.user.upsert({
    where: { employeeId: 'DMS-003' },
    update: {},
    create: {
      employeeId: 'DMS-003',
      email: 'sita.paudel@dynamatrix.local',
      name: 'Sita Paudel',
      systemRole: SystemRole.EMPLOYEE,
      passwordHash: 'dummyhash',
      mustChangePassword: false,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  // Create isolated test project
  const testProject = await db.project.create({
    data: {
      name: `Kanban & Milestone Test ${Date.now()}`,
      projectCode: `DF-KBN-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
      priority: Priority.HIGH,
      projectLeadId: leadUser.id,
      createdById: leadUser.id,
      members: {
        create: [
          {
            userId: leadUser.id,
            projectRole: ProjectMemberRole.PROJECT_LEAD,
            addedById: leadUser.id,
          },
          {
            userId: devUser.id,
            projectRole: ProjectMemberRole.DEVELOPER,
            addedById: leadUser.id,
          },
        ],
      },
    },
  });

  await t.test('1. Sequential Milestone Code Generation (KBN-M1, KBN-M2)', async () => {
    const code1 = await generateNextMilestoneCode(testProject.id);
    assert.equal(code1, 'KBN-M1');

    const m1 = await db.milestone.create({
      data: {
        milestoneCode: code1,
        projectId: testProject.id,
        name: 'Sprint 1 Core Backend',
        status: MilestoneStatus.IN_PROGRESS,
        createdById: leadUser.id,
      },
    });
    assert.ok(m1.id);

    const code2 = await generateNextMilestoneCode(testProject.id);
    assert.equal(code2, 'KBN-M2');

    const m2 = await db.milestone.create({
      data: {
        milestoneCode: code2,
        projectId: testProject.id,
        name: 'Sprint 2 Frontend MVP',
        status: MilestoneStatus.PLANNED,
        createdById: leadUser.id,
      },
    });
    assert.ok(m2.id);
  });

  await t.test('2. Milestone Progress Calculation (Automated vs Override)', async () => {
    const milestone = await db.milestone.create({
      data: {
        milestoneCode: await generateNextMilestoneCode(testProject.id),
        projectId: testProject.id,
        name: 'Release Candidate 1.0',
        status: MilestoneStatus.IN_PROGRESS,
        createdById: leadUser.id,
      },
    });

    // Create 4 tasks linked to milestone
    const t1 = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T01`,
        title: 'Task 1 - Done',
        projectId: testProject.id,
        milestoneId: milestone.id,
        createdById: leadUser.id,
        status: TaskStatus.COMPLETED,
        priority: Priority.MEDIUM,
      },
    });

    const t2 = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T02`,
        title: 'Task 2 - Done',
        projectId: testProject.id,
        milestoneId: milestone.id,
        createdById: leadUser.id,
        status: TaskStatus.COMPLETED,
        priority: Priority.MEDIUM,
      },
    });

    const t3 = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T03`,
        title: 'Task 3 - In Progress',
        projectId: testProject.id,
        milestoneId: milestone.id,
        createdById: leadUser.id,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
      },
    });

    const t4 = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T04`,
        title: 'Task 4 - Todo',
        projectId: testProject.id,
        milestoneId: milestone.id,
        createdById: leadUser.id,
        status: TaskStatus.TODO,
        priority: Priority.LOW,
      },
    });

    // Calculate progress: 2 out of 4 tasks are COMPLETED = 50%
    const fetchMilestone = await db.milestone.findUnique({
      where: { id: milestone.id },
      include: { tasks: { select: { status: true } } },
    });

    const totalTasks = fetchMilestone.tasks.length;
    const completedTasks = fetchMilestone.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const calculatedProgress = Math.round((completedTasks / totalTasks) * 100);

    assert.equal(totalTasks, 4);
    assert.equal(completedTasks, 2);
    assert.equal(calculatedProgress, 50);

    // Test Progress Override
    const updatedWithOverride = await db.milestone.update({
      where: { id: milestone.id },
      data: { progressOverride: 85 },
    });
    assert.equal(updatedWithOverride.progressOverride, 85);
  });

  await t.test('3. Milestone Archiving unlinks tasks cleanly', async () => {
    const milestone = await db.milestone.create({
      data: {
        milestoneCode: await generateNextMilestoneCode(testProject.id),
        projectId: testProject.id,
        name: 'Deprecated Milestone',
        status: MilestoneStatus.PLANNED,
        createdById: leadUser.id,
      },
    });

    const task = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T05`,
        title: 'Task linked to deprecating milestone',
        projectId: testProject.id,
        milestoneId: milestone.id,
        createdById: leadUser.id,
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
      },
    });

    assert.equal(task.milestoneId, milestone.id);

    // Archive milestone and unlink tasks
    await db.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id: milestone.id },
        data: { archivedAt: new Date() },
      });
      await tx.task.updateMany({
        where: { milestoneId: milestone.id },
        data: { milestoneId: null },
      });
    });

    const refreshedTask = await db.task.findUnique({
      where: { id: task.id },
    });
    assert.equal(refreshedTask.milestoneId, null);

    const archivedMilestone = await db.milestone.findUnique({
      where: { id: milestone.id },
    });
    assert.ok(archivedMilestone.archivedAt !== null);
  });

  await t.test('4. Kanban Board Task Status Columns and Blocker Reason Integrity', async () => {
    const blockedTask = await db.task.create({
      data: {
        taskCode: `${testProject.projectCode}-T06`,
        title: 'Payment Gateway Integration Blocked',
        projectId: testProject.id,
        createdById: leadUser.id,
        status: TaskStatus.BLOCKED,
        blockerReason: 'Awaiting third-party sandbox API credentials',
        priority: Priority.CRITICAL,
      },
    });

    assert.equal(blockedTask.status, TaskStatus.BLOCKED);
    assert.equal(blockedTask.blockerReason, 'Awaiting third-party sandbox API credentials');

    // Unblock task into IN_PROGRESS
    const unblocked = await db.task.update({
      where: { id: blockedTask.id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        blockerReason: null,
      },
    });
    assert.equal(unblocked.status, TaskStatus.IN_PROGRESS);
    assert.equal(unblocked.blockerReason, null);
  });

  // Cleanup test data
  await db.task.deleteMany({ where: { projectId: testProject.id } });
  await db.milestone.deleteMany({ where: { projectId: testProject.id } });
  await db.projectMember.deleteMany({ where: { projectId: testProject.id } });
  await db.activityLog.deleteMany({ where: { projectId: testProject.id } });
  await db.project.delete({ where: { id: testProject.id } });
});
