import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/server/db/client.ts";
import {
  TaskStatus,
  ProjectMemberRole,
  NotificationType,
  SystemRole,
  AccountStatus,
} from "@prisma/client";

test("Phase 6: Review Workflow, Comments & Audit Trail", async (t) => {
  // Ensure test users exist
  const leadUser = await db.user.upsert({
    where: { employeeId: "DMS-002" },
    update: {},
    create: {
      employeeId: "DMS-002",
      email: "ram.sharma@dynamatrix.local",
      name: "Ram Sharma",
      systemRole: SystemRole.EMPLOYEE,
      passwordHash: "dummyhash",
      mustChangePassword: false,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  const devUser = await db.user.upsert({
    where: { employeeId: "DMS-003" },
    update: {},
    create: {
      employeeId: "DMS-003",
      email: "sita.paudel@dynamatrix.local",
      name: "Sita Paudel",
      systemRole: SystemRole.EMPLOYEE,
      passwordHash: "dummyhash",
      mustChangePassword: false,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  // Create isolated test project
  const testProject = await db.project.create({
    data: {
      name: `Review Workflow Test ${Date.now()}`,
      projectCode: `DF-REV-${Date.now().toString().slice(-4)}`,
      status: "ACTIVE",
      priority: "MEDIUM",
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

  let testTaskId;

  await t.test("Assignee submits deliverable for review", async () => {
    // Create initial task in IN_PROGRESS
    const task = await db.task.create({
      data: {
        projectId: testProject.id,
        taskCode: `${testProject.projectCode}-001`,
        title: "Implement OAuth Callback Handler",
        assigneeId: devUser.id,
        createdById: leadUser.id,
        status: TaskStatus.IN_PROGRESS,
        progress: 80,
      },
    });
    testTaskId = task.id;

    // Simulate submission for review transaction
    const submissionNote =
      "OAuth flow tested with Google sandbox; ready for review.";
    const previousStatus = task.status;

    await db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: testTaskId },
        data: {
          status: TaskStatus.IN_REVIEW,
          submittedForReviewAt: new Date(),
        },
      });

      await tx.taskUpdate.create({
        data: {
          taskId: testTaskId,
          userId: devUser.id,
          previousStatus,
          newStatus: TaskStatus.IN_REVIEW,
          previousProgress: 80,
          newProgress: 80,
          note: `Submitted for review: ${submissionNote}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: leadUser.id,
          type: NotificationType.TASK_REVIEW_REQUESTED,
          title: `Review Requested: [${task.taskCode}]`,
          message: `${devUser.name} submitted "${task.title}" for review.`,
          projectId: testProject.id,
          entityType: "TASK",
          entityId: testTaskId,
        },
      });
    });

    const updated = await db.task.findUnique({
      where: { id: testTaskId },
      include: {
        updates: true,
      },
    });

    assert.equal(updated.status, TaskStatus.IN_REVIEW);
    assert.ok(updated.submittedForReviewAt);

    const latestUpdate = updated.updates[updated.updates.length - 1];
    assert.equal(latestUpdate.previousStatus, TaskStatus.IN_PROGRESS);
    assert.equal(latestUpdate.newStatus, TaskStatus.IN_REVIEW);

    const notif = await db.notification.findFirst({
      where: {
        userId: leadUser.id,
        type: NotificationType.TASK_REVIEW_REQUESTED,
        entityId: testTaskId,
      },
    });
    assert.ok(notif);
    assert.match(notif.message, new RegExp(`${devUser.name} submitted`));
  });

  await t.test(
    "Project Lead requests changes with audit feedback",
    async () => {
      assert.ok(testTaskId);
      const feedback =
        "Please add unit test coverage for invalid state tokens in callback.";

      await db.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: testTaskId },
          data: {
            status: TaskStatus.IN_PROGRESS,
            submittedForReviewAt: null,
          },
        });

        await tx.taskUpdate.create({
          data: {
            taskId: testTaskId,
            userId: leadUser.id,
            previousStatus: TaskStatus.IN_REVIEW,
            newStatus: TaskStatus.IN_PROGRESS,
            note: `Changes Requested: ${feedback}`,
          },
        });

        await tx.taskComment.create({
          data: {
            taskId: testTaskId,
            userId: leadUser.id,
            content: `🔄 **Changes Requested by ${leadUser.name}:**\n${feedback}`,
          },
        });

        await tx.notification.create({
          data: {
            userId: devUser.id,
            type: NotificationType.TASK_REVIEWED,
            title: `Changes Requested on Task`,
            message: `${leadUser.name} requested changes: ${feedback}`,
            projectId: testProject.id,
            entityType: "TASK",
            entityId: testTaskId,
          },
        });
      });

      const updated = await db.task.findUnique({
        where: { id: testTaskId },
        include: { comments: true },
      });

      assert.equal(updated.status, TaskStatus.IN_PROGRESS);
      assert.equal(updated.submittedForReviewAt, null);

      const changeComment = updated.comments.find((c) =>
        c.content.includes("Changes Requested"),
      );
      assert.ok(changeComment);
      assert.match(changeComment.content, /invalid state tokens/);
    },
  );

  await t.test(
    "Re-submitted and Lead approves deliverable as COMPLETED",
    async () => {
      assert.ok(testTaskId);

      // Resubmit
      await db.task.update({
        where: { id: testTaskId },
        data: {
          status: TaskStatus.IN_REVIEW,
          submittedForReviewAt: new Date(),
        },
      });

      // Lead approves
      const approvalNote =
        "All edge cases verified and tests passing with 98% coverage.";
      await db.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: testTaskId },
          data: {
            status: TaskStatus.COMPLETED,
            progress: 100,
            completedAt: new Date(),
          },
        });

        await tx.taskUpdate.create({
          data: {
            taskId: testTaskId,
            userId: leadUser.id,
            previousStatus: TaskStatus.IN_REVIEW,
            newStatus: TaskStatus.COMPLETED,
            previousProgress: 80,
            newProgress: 100,
            note: `Review Approved: ${approvalNote}`,
          },
        });

        await tx.notification.create({
          data: {
            userId: devUser.id,
            type: NotificationType.TASK_REVIEWED,
            title: "Deliverable Approved",
            message: `Your deliverable has been approved by ${leadUser.name}.`,
            projectId: testProject.id,
            entityType: "TASK",
            entityId: testTaskId,
          },
        });
      });

      const completedTask = await db.task.findUnique({
        where: { id: testTaskId },
      });
      assert.equal(completedTask.status, TaskStatus.COMPLETED);
      assert.equal(completedTask.progress, 100);
      assert.ok(completedTask.completedAt);
    },
  );

  await t.test(
    "Reopening completed deliverable requires audit reason",
    async () => {
      assert.ok(testTaskId);
      const reopenReason =
        "Production incident #104 requires backwards-compatible API parameters.";

      await db.$transaction(async (tx) => {
        await tx.task.update({
          where: { id: testTaskId },
          data: {
            status: TaskStatus.IN_PROGRESS,
            completedAt: null,
          },
        });

        await tx.taskUpdate.create({
          data: {
            taskId: testTaskId,
            userId: leadUser.id,
            previousStatus: TaskStatus.COMPLETED,
            newStatus: TaskStatus.IN_PROGRESS,
            note: `Task Reopened: ${reopenReason}`,
          },
        });

        await tx.taskComment.create({
          data: {
            taskId: testTaskId,
            userId: leadUser.id,
            content: `⚠️ **Deliverable Reopened by ${leadUser.name}:**\nReason: ${reopenReason}`,
          },
        });
      });

      const reopenedTask = await db.task.findUnique({
        where: { id: testTaskId },
        include: { updates: true, comments: true },
      });

      assert.equal(reopenedTask.status, TaskStatus.IN_PROGRESS);
      assert.equal(reopenedTask.completedAt, null);

      const lastUpdate = reopenedTask.updates[reopenedTask.updates.length - 1];
      assert.equal(lastUpdate.previousStatus, TaskStatus.COMPLETED);
      assert.equal(lastUpdate.newStatus, TaskStatus.IN_PROGRESS);
      assert.match(lastUpdate.note, /Production incident #104/);
    },
  );

  await t.test("Task comments thread creation and soft deletion", async () => {
    assert.ok(testTaskId);

    // Create comment
    const comment = await db.taskComment.create({
      data: {
        taskId: testTaskId,
        userId: devUser.id,
        content: "I have pushed hotfix branch with fallback parameter support.",
      },
    });

    assert.ok(comment.id);
    assert.equal(comment.deletedAt, null);

    // Soft delete comment
    await db.taskComment.update({
      where: { id: comment.id },
      data: { deletedAt: new Date() },
    });

    const deleted = await db.taskComment.findUnique({
      where: { id: comment.id },
    });
    assert.ok(deleted.deletedAt);

    // Filtered query ignores deleted comments
    const activeComments = await db.taskComment.findMany({
      where: { taskId: testTaskId, deletedAt: null },
    });
    assert.ok(!activeComments.some((c) => c.id === comment.id));
  });

  // Cleanup test project
  await db.project.delete({ where: { id: testProject.id } });
});
