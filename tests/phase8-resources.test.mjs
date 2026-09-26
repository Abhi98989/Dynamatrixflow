import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/server/db/client.ts';
import { ProjectStatus, Priority, SystemRole, ResourceCategory } from '@prisma/client';

test('Phase 8: Resources / Knowledge Hub', async (t) => {
  let adminUser;
  let devUser;
  let testProject;
  let testTask;
  let testResource;

  t.before(async () => {
    adminUser = await db.user.create({
      data: {
        employeeId: 'DMS-PH8-ADM',
        name: 'Phase 8 Admin',
        email: 'ph8admin@dynamatrix.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DUMMY$',
        systemRole: SystemRole.ADMIN,
      },
    });

    devUser = await db.user.create({
      data: {
        employeeId: 'DMS-PH8-DEV',
        name: 'Phase 8 Dev',
        email: 'ph8dev@dynamatrix.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DUMMY$',
        systemRole: SystemRole.EMPLOYEE,
      },
    });

    testProject = await db.project.create({
      data: {
        projectCode: 'DF-PH8',
        name: 'Phase 8 Knowledge Hub',
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

    testTask = await db.task.create({
      data: {
        taskCode: 'DF-PH8-T01',
        title: 'Initial Research',
        projectId: testProject.id,
        createdById: adminUser.id,
      }
    });
  });

  await t.test('1. Create Resource with related task and activity log', async () => {
    testResource = await db.projectResource.create({
      data: {
        projectId: testProject.id,
        title: 'Project Wiki',
        url: 'https://wiki.example.com',
        category: ResourceCategory.DOCUMENTATION,
        addedById: devUser.id,
        relatedTaskId: testTask.id,
        tags: ['wiki', 'docs'],
      },
    });

    assert.ok(testResource.id);
    assert.equal(testResource.category, ResourceCategory.DOCUMENTATION);
    assert.equal(testResource.url, 'https://wiki.example.com');
    assert.equal(testResource.tags.length, 2);

    const log = await db.activityLog.create({
      data: {
        projectId: testProject.id,
        actorId: devUser.id,
        action: 'CREATED_RESOURCE',
        entityType: 'RESOURCE',
        entityId: testResource.id,
      },
    });
    assert.ok(log.id);
  });

  await t.test('2. Update Resource fields', async () => {
    const updated = await db.projectResource.update({
      where: { id: testResource.id },
      data: {
        title: 'Updated Wiki',
        category: ResourceCategory.RESEARCH,
      },
    });
    
    assert.equal(updated.title, 'Updated Wiki');
    assert.equal(updated.category, ResourceCategory.RESEARCH);
  });

  await t.test('3. Archive Resource', async () => {
    const archived = await db.projectResource.update({
      where: { id: testResource.id },
      data: { archivedAt: new Date() },
    });
    
    assert.ok(archived.archivedAt instanceof Date);
  });

  t.after(async () => {
    await db.activityLog.deleteMany({ where: { projectId: testProject.id } });
    await db.projectResource.deleteMany({ where: { projectId: testProject.id } });
    await db.task.deleteMany({ where: { projectId: testProject.id } });
    await db.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await db.project.delete({ where: { id: testProject.id } });
    await db.user.deleteMany({ where: { id: { in: [adminUser.id, devUser.id] } } });
  });
});
