import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/server/db/client.ts";
import { generateNextEmployeeId } from "../src/features/employees/id-generator.ts";
import { generateTemporaryPassword } from "../src/features/employees/credential-generator.ts";
import { hash, verify } from "@node-rs/argon2";
import { SystemRole, AccountStatus } from "@prisma/client";

test("Phase 3: Employee ID & Credential Generation", async (t) => {
  await t.test(
    "generateTemporaryPassword creates high-entropy passwords",
    () => {
      const pwd1 = generateTemporaryPassword(12);
      const pwd2 = generateTemporaryPassword(16);

      assert.equal(pwd1.length, 12);
      assert.equal(pwd2.length, 16);
      assert.notEqual(pwd1, pwd2);
      assert.match(pwd1, /[A-Za-z0-9]/);
    },
  );

  await t.test(
    "generateNextEmployeeId formats as DMS-### and increments based on max in DB",
    async () => {
      const nextId = await generateNextEmployeeId();
      assert.match(nextId, /^DMS-\d{3,}$/);

      // Existing seed data has DMS-001 through DMS-006, so next should be at least DMS-007
      const num = parseInt(nextId.replace("DMS-", ""), 10);
      assert.ok(num >= 7, `Expected ID number >= 7, got ${num}`);
    },
  );
});

test("Phase 3: Employee Creation, Status Management, and Audit Trail", async (t) => {
  const adminUser = await db.user.findFirst({
    where: {
      systemRole: SystemRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    },
  });
  assert.ok(adminUser, "Active admin user must exist");

  let createdUserId = null;
  let testEmpId = null;

  await t.test(
    "Create employee with DMS-###, temporary password, and ActivityLog audit",
    async () => {
      const nextEmpId = await generateNextEmployeeId();
      testEmpId = nextEmpId;
      const tempPassword = generateTemporaryPassword(12);
      const passwordHash = await hash(tempPassword);

      const newUser = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            employeeId: testEmpId,
            name: "Test Candidate",
            email: `test-${Date.now()}@dynamatrix.internal`,
            position: "QA Automation Engineer",
            systemRole: SystemRole.EMPLOYEE,
            passwordHash,
            mustChangePassword: true,
            accountStatus: AccountStatus.ACTIVE,
            createdById: adminUser.id,
          },
        });

        await tx.activityLog.create({
          data: {
            actorId: adminUser.id,
            action: "EMPLOYEE_CREATED",
            entityType: "User",
            entityId: user.id,
            metadata: {
              employeeId: user.employeeId,
              name: user.name,
              position: user.position,
              systemRole: user.systemRole,
            },
          },
        });

        return user;
      });

      createdUserId = newUser.id;
      assert.equal(newUser.employeeId, testEmpId);
      assert.equal(newUser.mustChangePassword, true);
      assert.equal(newUser.accountStatus, AccountStatus.ACTIVE);

      // Verify temp password works
      const isPasswordValid = await verify(newUser.passwordHash, tempPassword);
      assert.equal(isPasswordValid, true);

      // Verify ActivityLog was created
      const log = await db.activityLog.findFirst({
        where: {
          entityId: newUser.id,
          action: "EMPLOYEE_CREATED",
        },
      });
      assert.ok(log, "EMPLOYEE_CREATED log entry must exist");
      assert.equal(log.actorId, adminUser.id);
    },
  );

  await t.test(
    "Admin password reset updates hash, re-sets mustChangePassword, and logs event",
    async () => {
      assert.ok(createdUserId, "Created user ID must exist");

      const newTempPassword = generateTemporaryPassword(14);
      const newHash = await hash(newTempPassword);

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: createdUserId },
          data: {
            passwordHash: newHash,
            mustChangePassword: true,
          },
        });

        await tx.activityLog.create({
          data: {
            actorId: adminUser.id,
            action: "PASSWORD_RESET",
            entityType: "User",
            entityId: createdUserId,
            metadata: {
              employeeId: testEmpId,
              initiatedByAdmin: true,
            },
          },
        });
      });

      const updated = await db.user.findUnique({
        where: { id: createdUserId },
      });
      assert.equal(updated.mustChangePassword, true);

      const matches = await verify(updated.passwordHash, newTempPassword);
      assert.equal(matches, true);

      const resetLog = await db.activityLog.findFirst({
        where: {
          entityId: createdUserId,
          action: "PASSWORD_RESET",
        },
      });
      assert.ok(resetLog, "PASSWORD_RESET log entry must exist");
    },
  );

  await t.test(
    "Status transition (SUSPENDED / INACTIVE) updates account and logs audit event",
    async () => {
      assert.ok(createdUserId);

      // Suspend
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: createdUserId },
          data: { accountStatus: AccountStatus.SUSPENDED },
        });

        await tx.activityLog.create({
          data: {
            actorId: adminUser.id,
            action: "EMPLOYEE_STATUS_CHANGED",
            entityType: "User",
            entityId: createdUserId,
            metadata: {
              previousStatus: AccountStatus.ACTIVE,
              newStatus: AccountStatus.SUSPENDED,
            },
          },
        });
      });

      let check = await db.user.findUnique({ where: { id: createdUserId } });
      assert.equal(check.accountStatus, AccountStatus.SUSPENDED);

      // Deactivate
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: createdUserId },
          data: { accountStatus: AccountStatus.INACTIVE },
        });

        await tx.activityLog.create({
          data: {
            actorId: adminUser.id,
            action: "EMPLOYEE_DEACTIVATED",
            entityType: "User",
            entityId: createdUserId,
            metadata: {
              previousStatus: AccountStatus.SUSPENDED,
              newStatus: AccountStatus.INACTIVE,
            },
          },
        });
      });

      check = await db.user.findUnique({ where: { id: createdUserId } });
      assert.equal(check.accountStatus, AccountStatus.INACTIVE);

      // Reactivate
      await db.user.update({
        where: { id: createdUserId },
        data: { accountStatus: AccountStatus.ACTIVE },
      });

      check = await db.user.findUnique({ where: { id: createdUserId } });
      assert.equal(check.accountStatus, AccountStatus.ACTIVE);
    },
  );

  // Cleanup test user
  t.after(async () => {
    if (createdUserId) {
      await db.activityLog.deleteMany({ where: { entityId: createdUserId } });
      await db.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });
});
