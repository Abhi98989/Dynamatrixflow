import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { PrismaClient } from "@prisma/client";
import { verify } from "@node-rs/argon2";

let prisma;

before(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

after(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

test("Phase 1 DB: All core models and seed records exist", async () => {
  const userCount = await prisma.user.count();
  const projectCount = await prisma.project.count();
  const memberCount = await prisma.projectMember.count();
  const taskCount = await prisma.task.count();
  const subtaskCount = await prisma.subtask.count();
  const updateCount = await prisma.taskUpdate.count();
  const commentCount = await prisma.taskComment.count();
  const resourceCount = await prisma.projectResource.count();
  const activityCount = await prisma.activityLog.count();
  const notifCount = await prisma.notification.count();

  assert.ok(userCount >= 6, `Expected at least 6 users, found ${userCount}`);
  assert.ok(
    projectCount >= 2,
    `Expected at least 2 projects, found ${projectCount}`,
  );
  assert.ok(
    memberCount >= 5,
    `Expected at least 5 project members, found ${memberCount}`,
  );
  assert.ok(taskCount >= 4, `Expected at least 4 tasks, found ${taskCount}`);
  assert.ok(
    subtaskCount >= 4,
    `Expected at least 4 subtasks, found ${subtaskCount}`,
  );
  assert.ok(
    updateCount >= 3,
    `Expected at least 3 task updates, found ${updateCount}`,
  );
  assert.ok(
    commentCount >= 2,
    `Expected at least 2 task comments, found ${commentCount}`,
  );
  assert.ok(
    resourceCount >= 3,
    `Expected at least 3 resources, found ${resourceCount}`,
  );
  assert.ok(
    activityCount >= 4,
    `Expected at least 4 activity logs, found ${activityCount}`,
  );
  assert.ok(
    notifCount >= 2,
    `Expected at least 2 notifications, found ${notifCount}`,
  );
});

test("Phase 1 DB: Password security - hashed with Argon2id and never plaintext", async () => {
  const users = await prisma.user.findMany({
    select: { employeeId: true, passwordHash: true },
  });
  for (const user of users) {
    assert.ok(
      user.passwordHash.startsWith("$argon2id$"),
      `User ${user.employeeId} password is not Argon2id hash`,
    );
    if (
      [
        "DMS-001",
        "DMS-002",
        "DMS-003",
        "DMS-004",
        "DMS-005",
        "DMS-006",
      ].includes(user.employeeId)
    ) {
      const isValid = await verify(user.passwordHash, "DynamatrixDev123!");
      assert.equal(
        isValid,
        true,
        `Seed password should verify for ${user.employeeId}`,
      );
    }
  }
});

test("Phase 1 DB: Business ID formats adhere to specification", async () => {
  const admin = await prisma.user.findUnique({
    where: { employeeId: "DMS-001" },
  });
  assert.ok(admin, "Admin DMS-001 must exist");
  assert.equal(admin.systemRole, "ADMIN");

  const expoProject = await prisma.project.findUnique({
    where: { projectCode: "DF-EXP-001" },
  });
  assert.ok(expoProject, "Project DF-EXP-001 must exist");
  assert.equal(expoProject.status, "ACTIVE");

  const task1 = await prisma.task.findUnique({
    where: { taskCode: "EXP-001" },
  });
  assert.ok(task1, "Task EXP-001 must exist");
  assert.equal(task1.projectId, expoProject.id);

  const milestone1 = await prisma.milestone.findUnique({
    where: { milestoneCode: "EXP-M01" },
  });
  assert.ok(milestone1, "Milestone EXP-M01 must exist");
});

test("Phase 1 DB: Project relational integrity and membership isolation", async () => {
  const project = await prisma.project.findUnique({
    where: { projectCode: "DF-EXP-001" },
    include: {
      projectLead: true,
      members: { include: { user: true } },
      tasks: { include: { subtasks: true, updates: true, comments: true } },
      resources: true,
    },
  });

  assert.ok(project);
  assert.equal(project.projectLead.employeeId, "DMS-002");
  assert.ok(project.members.length >= 5);

  // Check subtask linkage
  const checkoutTask = project.tasks.find((t) => t.taskCode === "EXP-001");
  assert.ok(checkoutTask);
  assert.ok(checkoutTask.subtasks.length >= 4);

  // Check resource linkage
  const khaltiResource = project.resources.find((r) => r.category === "API");
  assert.ok(khaltiResource);
  assert.ok(khaltiResource.url.startsWith("https://"));
});
