import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { PrismaClient, TaskStatus, SystemRole } from "@prisma/client";
import { authenticateUser } from "../src/server/auth/config";
import { checkRateLimit, resetRateLimit } from "../src/server/auth/rate-limit";
import {
  canViewProject,
  canManageProject,
  canManageMembers,
  canCreateTask,
  canUpdateTask,
  canReviewTask,
  isAllowedStatusTransition,
} from "../src/server/auth/authorization";

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

test("Phase 2 Auth: Rate limiter throttles after limit", () => {
  const testKey = "test-ip-rate-limit";
  resetRateLimit(testKey);

  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testKey, 5, 60);
    assert.equal(res.allowed, true);
  }

  const blocked = checkRateLimit(testKey, 5, 60);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.resetInSeconds > 0);

  resetRateLimit(testKey);
});

test("Phase 2 Auth: Credentials provider authorizes valid user and rejects invalid", async () => {
  // 1. Valid Admin credentials
  const validAdmin = await authenticateUser({
    employeeId: "DMS-001",
    password: "DynamatrixDev123!",
  });
  assert.ok(validAdmin);
  assert.equal(validAdmin.employeeId, "DMS-001");
  assert.equal(validAdmin.systemRole, "ADMIN");
  assert.equal(validAdmin.mustChangePassword, false);

  // 2. Case-insensitive Employee ID match
  const caseInsensitive = await authenticateUser({
    employeeId: "dms-001",
    password: "DynamatrixDev123!",
  });
  assert.ok(caseInsensitive);
  assert.equal(caseInsensitive.employeeId, "DMS-001");

  // 3. Wrong password
  const wrongPassword = await authenticateUser({
    employeeId: "DMS-001",
    password: "WrongPassword123!",
  });
  assert.equal(wrongPassword, null);

  // 4. Non-existent employee ID
  const unknownUser = await authenticateUser({
    employeeId: "DMS-999",
    password: "DynamatrixDev123!",
  });
  assert.equal(unknownUser, null);
});

test("Phase 2 Auth: Inactive / Suspended account rejection", async () => {
  // Ensure clean state before test
  await prisma.user.deleteMany({ where: { employeeId: "DMS-TEST-INACTIVE" } });

  // Create temporary inactive user
  const inactiveUser = await prisma.user.create({
    data: {
      employeeId: "DMS-TEST-INACTIVE",
      name: "Inactive Tester",
      passwordHash:
        "$argon2id$v=19$m=19456,t=2,p=1$QQJoBFuufW5MD6ktucX2+g$FayNDsW0H68ag1lo/NJd4jQDjqaKzVPwEprIVbVP2CI",
      systemRole: "EMPLOYEE",
      accountStatus: "INACTIVE",
    },
  });

  await assert.rejects(async () => {
    await authenticateUser({
      employeeId: "DMS-TEST-INACTIVE",
      password: "DynamatrixDev123!",
    });
  }, /inactive or suspended/);

  // Cleanup
  await prisma.user.delete({ where: { id: inactiveUser.id } });
});

test("Phase 2 Auth: mustChangePassword status correctly loaded", async () => {
  // DMS-003 (Abhishek) was seeded with mustChangePassword = true
  const abhishek = await authenticateUser({
    employeeId: "DMS-003",
    password: "DynamatrixDev123!",
  });
  assert.ok(abhishek);
  assert.equal(abhishek.mustChangePassword, true);

  // DMS-001 (Admin) was seeded with mustChangePassword = false
  const admin = await authenticateUser({
    employeeId: "DMS-001",
    password: "DynamatrixDev123!",
  });
  assert.ok(admin);
  assert.equal(admin.mustChangePassword, false);
});

test("Phase 2 Auth: Central authorization helpers enforce RBAC and project scoping", async () => {
  const admin = await prisma.user.findUnique({
    where: { employeeId: "DMS-001" },
  });
  const leadRam = await prisma.user.findUnique({
    where: { employeeId: "DMS-002" },
  });
  const devAbhishek = await prisma.user.findUnique({
    where: { employeeId: "DMS-003" },
  });
  const expoProject = await prisma.project.findUnique({
    where: { projectCode: "DF-EXP-001" },
  });
  const opsProject = await prisma.project.findUnique({
    where: { projectCode: "DF-INT-002" },
  });

  assert.ok(admin && leadRam && devAbhishek && expoProject && opsProject);

  // 1. Project view access
  assert.equal(await canViewProject(admin.id, expoProject.id), true);
  assert.equal(await canViewProject(admin.id, opsProject.id), true);

  // Lead Ram leads expoProject and opsProject
  assert.equal(await canViewProject(leadRam.id, expoProject.id), true);

  // Abhishek is member of expoProject, but NOT opsProject
  assert.equal(await canViewProject(devAbhishek.id, expoProject.id), true);
  assert.equal(await canViewProject(devAbhishek.id, opsProject.id), false);

  // 2. Project management access
  assert.equal(await canManageProject(admin.id, expoProject.id), true);
  assert.equal(await canManageProject(leadRam.id, expoProject.id), true);
  assert.equal(await canManageProject(devAbhishek.id, expoProject.id), false);

  // 3. Member management access
  assert.equal(await canManageMembers(admin.id, expoProject.id), true);
  assert.equal(await canManageMembers(leadRam.id, expoProject.id), true);
  assert.equal(await canManageMembers(devAbhishek.id, expoProject.id), false);

  // 4. Task creation access
  assert.equal(await canCreateTask(admin.id, expoProject.id), true);
  assert.equal(await canCreateTask(leadRam.id, expoProject.id), true);
  assert.equal(await canCreateTask(devAbhishek.id, expoProject.id), false);

  // 5. Task update and review access
  const task1 = await prisma.task.findUnique({
    where: { taskCode: "EXP-001" },
  });
  assert.ok(task1);
  // Admin and Lead can update
  assert.equal(await canUpdateTask(admin.id, task1.id), true);
  assert.equal(await canUpdateTask(leadRam.id, task1.id), true);
  // Assignee Abhishek can update his own task
  assert.equal(await canUpdateTask(devAbhishek.id, task1.id), true);

  // Review access: Lead Ram can review, but Abhishek cannot approve own review
  assert.equal(await canReviewTask(leadRam.id, task1.id), true);
  assert.equal(await canReviewTask(devAbhishek.id, task1.id), false);
});

test("Phase 2 Auth: Task status transition rules", async () => {
  // Employee/Assignee normal lifecycle
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      true,
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
    ),
    true,
  );
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      true,
      TaskStatus.IN_PROGRESS,
      TaskStatus.BLOCKED,
    ),
    true,
  );
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      true,
      TaskStatus.BLOCKED,
      TaskStatus.IN_PROGRESS,
    ),
    true,
  );
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      true,
      TaskStatus.IN_PROGRESS,
      TaskStatus.IN_REVIEW,
    ),
    true,
  );

  // Employee CANNOT approve own review into COMPLETED
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      true,
      TaskStatus.IN_REVIEW,
      TaskStatus.COMPLETED,
    ),
    false,
  );

  // Lead / Admin CAN approve review into COMPLETED
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.PROJECT_LEAD,
      true,
      false,
      TaskStatus.IN_REVIEW,
      TaskStatus.COMPLETED,
    ),
    true,
  );

  // Lead / Admin CAN request changes (IN_REVIEW -> IN_PROGRESS)
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.PROJECT_LEAD,
      true,
      false,
      TaskStatus.IN_REVIEW,
      TaskStatus.IN_PROGRESS,
    ),
    true,
  );

  // Non-member or non-assignee employee CANNOT change status
  assert.equal(
    isAllowedStatusTransition(
      SystemRole.EMPLOYEE,
      false,
      false,
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
    ),
    false,
  );
});
