import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/server/db/client.ts';
import { ProjectStatus, Priority, SystemRole, TaskStatus } from '@prisma/client';

test('Phase 10: Dashboards & Reporting', async (t) => {
  let adminUser;
  let devUser;
  let testProject;
  let testTask;

  t.before(async () => {
    adminUser = await db.user.create({
      data: {
        employeeId: 'DMS-PH10-ADM',
        name: 'Phase 10 Admin',
        email: 'ph10admin@dynamatrix.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DUMMY$',
        systemRole: SystemRole.ADMIN,
      },
    });

    devUser = await db.user.create({
      data: {
        employeeId: 'DMS-PH10-DEV',
        name: 'Phase 10 Dev',
        email: 'ph10dev@dynamatrix.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DUMMY$',
        systemRole: SystemRole.EMPLOYEE,
      },
    });

    testProject = await db.project.create({
      data: {
        projectCode: 'DF-PH10',
        name: 'Phase 10 Dash',
        status: ProjectStatus.ACTIVE,
        priority: Priority.HIGH,
        createdById: adminUser.id,
      },
    });

    await db.projectMember.create({
      data: {
        projectId: testProject.id,
        userId: devUser.id,
        projectRole: 'DEVELOPER',
        addedById: adminUser.id,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 2);

    testTask = await db.task.create({
      data: {
        taskCode: 'DF-PH10-T01',
        title: 'Dash Overdue Task',
        projectId: testProject.id,
        createdById: adminUser.id,
        assigneeId: devUser.id,
        dueDate: pastDate,
        status: TaskStatus.IN_PROGRESS,
      }
    });
  });

  await t.test('1. Admin dashboard fetch', async () => {
    const activeProjectsCount = await db.project.count({
      where: { status: { not: ProjectStatus.ARCHIVED } }
    });
    assert.ok(activeProjectsCount >= 1);
    
    const overdueCount = await db.task.count({
      where: { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }, dueDate: { lt: new Date(new Date().setHours(0,0,0,0)) } }
    });
    assert.ok(overdueCount >= 1);
  });

  await t.test('2. Employee dashboard fetch', async () => {
    const employeeProjectsCount = await db.project.count({
      where: {
        status: { not: ProjectStatus.ARCHIVED },
        members: { some: { userId: devUser.id, removedAt: null } }
      }
    });
    assert.equal(employeeProjectsCount, 1);
    
    const upcomingDeadlines = await db.task.findMany({
      where: { assigneeId: devUser.id, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }, dueDate: { not: null } },
    });
    assert.ok(upcomingDeadlines.length >= 1);
  });

  t.after(async () => {
    await db.task.deleteMany({ where: { projectId: testProject.id } });
    await db.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await db.project.delete({ where: { id: testProject.id } });
    await db.user.deleteMany({ where: { id: { in: [adminUser.id, devUser.id] } } });
  });
});
