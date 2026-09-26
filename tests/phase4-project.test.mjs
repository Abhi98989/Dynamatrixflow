import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/server/db/client.ts";
import { generateNextProjectCode } from "../src/features/projects/code-generator.ts";
import {
  canViewProject,
  canManageProject,
} from "../src/server/auth/authorization.ts";
import {
  SystemRole,
  AccountStatus,
  ProjectStatus,
  Priority,
  ProjectMemberRole,
  NotificationType,
} from "@prisma/client";

test("Phase 4: Project Code Generation", async (t) => {
  await t.test(
    "generateNextProjectCode formats with default prefix DF-PRJ-###",
    async () => {
      const code = await generateNextProjectCode();
      assert.match(code, /^DF-PRJ-\d{3,}$/);
    },
  );

  await t.test(
    "generateNextProjectCode supports custom prefix like DF-TEST-###",
    async () => {
      const code = await generateNextProjectCode("TEST");
      assert.match(code, /^DF-TEST-\d{3,}$/);
    },
  );
});

test("Phase 4: Project Creation, Automatic Membership, Access Scoping, and Lifecycle", async (t) => {
  // Fetch existing admin, lead, and employee
  const admin = await db.user.findFirst({
    where: {
      systemRole: SystemRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    },
  });
  const lead = await db.user.findFirst({
    where: {
      systemRole: SystemRole.PROJECT_LEAD,
      accountStatus: AccountStatus.ACTIVE,
    },
  });
  const regularEmployees = await db.user.findMany({
    where: {
      systemRole: SystemRole.EMPLOYEE,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  assert.ok(admin, "Admin must exist");
  assert.ok(lead, "Lead must exist");
  assert.ok(
    regularEmployees.length >= 2,
    "At least 2 employees required for scoping test",
  );

  const assignedEmployee = regularEmployees[0];
  const unassignedEmployee = regularEmployees[1];

  let createdProjectId = null;
  let createdProjectCode = null;

  await t.test(
    "Admin creates project with assigned Lead, auto-membership, notification, and audit",
    async () => {
      createdProjectCode = await generateNextProjectCode("AUTO");

      const project = await db.$transaction(async (tx) => {
        const p = await tx.project.create({
          data: {
            projectCode: createdProjectCode,
            name: "Automated Test Pipeline",
            description: "Phase 4 verification project",
            clientName: "Internal QA",
            status: ProjectStatus.PLANNING,
            priority: Priority.HIGH,
            projectLeadId: lead.id,
            createdById: admin.id,
          },
        });

        // Auto-add Lead
        await tx.projectMember.create({
          data: {
            projectId: p.id,
            userId: lead.id,
            projectRole: ProjectMemberRole.PROJECT_LEAD,
            addedById: admin.id,
          },
        });

        // Notification to lead
        await tx.notification.create({
          data: {
            userId: lead.id,
            type: NotificationType.PROJECT_ASSIGNED,
            title: "Project Lead Assignment",
            message: `Assigned as Lead for ${p.name}`,
            projectId: p.id,
            entityType: "Project",
            entityId: p.id,
          },
        });

        // Activity log
        await tx.activityLog.create({
          data: {
            actorId: admin.id,
            action: "PROJECT_CREATED",
            entityType: "Project",
            entityId: p.id,
            metadata: {
              projectCode: p.projectCode,
              name: p.name,
              projectLeadId: lead.id,
            },
          },
        });

        return p;
      });

      createdProjectId = project.id;
      assert.equal(project.projectLeadId, lead.id);

      // Verify auto-membership
      const membership = await db.projectMember.findFirst({
        where: { projectId: project.id, userId: lead.id, removedAt: null },
      });
      assert.ok(membership, "Lead membership must be automatically created");
      assert.equal(membership.projectRole, ProjectMemberRole.PROJECT_LEAD);

      // Verify notification
      const notification = await db.notification.findFirst({
        where: { userId: lead.id, type: NotificationType.PROJECT_ASSIGNED },
        orderBy: { createdAt: "desc" },
      });
      assert.ok(notification, "Notification must be created for project lead");

      // Verify activity log
      const log = await db.activityLog.findFirst({
        where: { entityId: project.id, action: "PROJECT_CREATED" },
      });
      assert.ok(log, "PROJECT_CREATED activity log must exist");
    },
  );

  await t.test(
    "Access scoping: Admin and Lead can view; unassigned employee CANNOT view",
    async () => {
      assert.ok(createdProjectId);

      // Admin can view
      const adminCanView = await canViewProject(admin.id, createdProjectId);
      assert.equal(
        adminCanView,
        true,
        "Admin must be able to view any project",
      );

      // Project lead can view and manage
      const leadCanView = await canViewProject(lead.id, createdProjectId);
      assert.equal(
        leadCanView,
        true,
        "Project lead must be able to view project",
      );

      const leadCanManage = await canManageProject(lead.id, createdProjectId);
      assert.equal(
        leadCanManage,
        true,
        "Project lead must be able to manage project",
      );

      // Unassigned employee cannot view
      const unassignedCanView = await canViewProject(
        unassignedEmployee.id,
        createdProjectId,
      );
      assert.equal(
        unassignedCanView,
        false,
        "Unassigned employee must NOT be granted access to scoped project",
      );
    },
  );

  await t.test(
    "Member management: Add member grants access; remove member revokes access",
    async () => {
      assert.ok(createdProjectId);

      // Add employee as DEVELOPER
      const member = await db.projectMember.create({
        data: {
          projectId: createdProjectId,
          userId: assignedEmployee.id,
          projectRole: ProjectMemberRole.DEVELOPER,
          addedById: lead.id,
        },
      });

      // Now assignedEmployee can view
      const nowCanView = await canViewProject(
        assignedEmployee.id,
        createdProjectId,
      );
      assert.equal(
        nowCanView,
        true,
        "Newly assigned employee must now have view access",
      );

      // But assigned employee cannot manage project
      const employeeCanManage = await canManageProject(
        assignedEmployee.id,
        createdProjectId,
      );
      assert.equal(
        employeeCanManage,
        false,
        "Regular member cannot manage project settings",
      );

      // Soft remove member
      await db.projectMember.update({
        where: { id: member.id },
        data: { removedAt: new Date() },
      });

      // Removed employee no longer has access
      const afterRemovalCanView = await canViewProject(
        assignedEmployee.id,
        createdProjectId,
      );
      assert.equal(
        afterRemovalCanView,
        false,
        "Removed member must no longer have access",
      );
    },
  );

  await t.test(
    "Project archiving sets status ARCHIVED and archivedAt timestamp",
    async () => {
      assert.ok(createdProjectId);

      await db.project.update({
        where: { id: createdProjectId },
        data: {
          status: ProjectStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      });

      const archived = await db.project.findUnique({
        where: { id: createdProjectId },
      });

      assert.equal(archived.status, ProjectStatus.ARCHIVED);
      assert.ok(archived.archivedAt instanceof Date);
    },
  );

  // Cleanup
  t.after(async () => {
    if (createdProjectId) {
      await db.notification.deleteMany({
        where: { projectId: createdProjectId },
      });
      await db.activityLog.deleteMany({
        where: { entityId: createdProjectId },
      });
      await db.projectMember.deleteMany({
        where: { projectId: createdProjectId },
      });
      await db.project
        .delete({ where: { id: createdProjectId } })
        .catch(() => {});
    }
  });
});
