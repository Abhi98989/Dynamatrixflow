import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/server/db/client.ts";
import {
  ProjectStatus,
  Priority,
  SystemRole,
  NotificationType,
  TaskStatus,
} from "@prisma/client";

test("Phase 9: Notifications & Activity", async (t) => {
  let adminUser;
  let devUser;
  let testProject;
  let testTask;
  let testNotification;

  t.before(async () => {
    adminUser = await db.user.create({
      data: {
        employeeId: "DMS-PH9-ADM",
        name: "Phase 9 Admin",
        email: "ph9admin@dynamatrix.com",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$DUMMY$",
        systemRole: SystemRole.ADMIN,
      },
    });

    devUser = await db.user.create({
      data: {
        employeeId: "DMS-PH9-DEV",
        name: "Phase 9 Dev",
        email: "ph9dev@dynamatrix.com",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$DUMMY$",
        systemRole: SystemRole.EMPLOYEE,
      },
    });

    testProject = await db.project.create({
      data: {
        projectCode: "DF-PH9",
        name: "Phase 9 Notifs",
        status: ProjectStatus.ACTIVE,
        priority: Priority.HIGH,
        createdById: adminUser.id,
      },
    });

    await db.projectMember.create({
      data: {
        projectId: testProject.id,
        userId: devUser.id,
        projectRole: "DEVELOPER",
        addedById: adminUser.id,
      },
    });

    testTask = await db.task.create({
      data: {
        taskCode: "DF-PH9-T01",
        title: "Notification Test Task",
        projectId: testProject.id,
        createdById: adminUser.id,
        assigneeId: devUser.id,
      },
    });
  });

  await t.test("1. Create Notification", async () => {
    testNotification = await db.notification.create({
      data: {
        userId: devUser.id,
        type: NotificationType.TASK_ASSIGNED,
        title: "Test Notification",
        message: "You have a test notification",
        projectId: testProject.id,
        entityType: "Task",
        entityId: testTask.id,
      },
    });

    assert.ok(testNotification.id);
    assert.equal(testNotification.isRead, false);
  });

  await t.test("2. Unread count query", async () => {
    const unreadCount = await db.notification.count({
      where: { userId: devUser.id, isRead: false },
    });
    assert.equal(unreadCount, 1);
  });

  await t.test("3. Mark Notification as Read", async () => {
    const updated = await db.notification.update({
      where: { id: testNotification.id },
      data: { isRead: true, readAt: new Date() },
    });

    assert.equal(updated.isRead, true);
    assert.ok(updated.readAt instanceof Date);

    const unreadCount = await db.notification.count({
      where: { userId: devUser.id, isRead: false },
    });
    assert.equal(unreadCount, 0);
  });

  await t.test("4. Global Activity Log fetch", async () => {
    const log = await db.activityLog.create({
      data: {
        actorId: devUser.id,
        action: "TASK_STATUS_CHANGED",
        entityType: "Task",
        entityId: testTask.id,
        projectId: testProject.id,
      },
    });

    const recentLogs = await db.activityLog.findMany({
      where: { actorId: devUser.id },
      take: 5,
    });
    assert.ok(recentLogs.length > 0);
  });

  t.after(async () => {
    await db.notification.deleteMany({ where: { projectId: testProject.id } });
    await db.activityLog.deleteMany({ where: { projectId: testProject.id } });
    await db.task.deleteMany({ where: { projectId: testProject.id } });
    await db.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await db.project.delete({ where: { id: testProject.id } });
    await db.user.deleteMany({
      where: { id: { in: [adminUser.id, devUser.id] } },
    });
  });
});
