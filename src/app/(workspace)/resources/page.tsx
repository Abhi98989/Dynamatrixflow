import { Metadata } from 'next';
import { db } from '@/server/db/client';
import { requireActiveUser } from '@/server/auth/authorization';
import { SystemRole } from '@prisma/client';
import {
  WorkspaceResourceHub,
  ResourceItem,
} from '@/features/resources/workspace-resource-hub';

export const metadata: Metadata = {
  title: 'Knowledge Hub & Resources | Dynamatrix Flow',
  description:
    'Centralized repository for documentation, architecture blueprints, API specifications, and research assets.',
};

export default async function ResourcesPage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  // Determine accessible projects
  const userProjectFilter = isAdmin
    ? { archivedAt: null }
    : {
        archivedAt: null,
        OR: [
          { projectLeadId: currentUser.id },
          { members: { some: { userId: currentUser.id, removedAt: null } } },
        ],
      };

  const accessibleProjects = await db.project.findMany({
    where: userProjectFilter,
    select: {
      id: true,
      name: true,
      projectCode: true,
    },
    orderBy: { name: 'asc' },
  });

  const accessibleProjectIds = accessibleProjects.map((p) => p.id);

  // Fetch all active resources across accessible projects
  const rawResources = await db.projectResource.findMany({
    where: {
      archivedAt: null,
      projectId: { in: accessibleProjectIds },
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true } },
      addedBy: { select: { id: true, name: true } },
      relatedTask: { select: { id: true, taskCode: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize to JSON-safe format
  const resources: ResourceItem[] = rawResources.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    description: r.description,
    category: r.category,
    tags: r.tags,
    projectId: r.projectId,
    project: {
      id: r.project.id,
      name: r.project.name,
      projectCode: r.project.projectCode,
    },
    addedBy: {
      id: r.addedBy.id,
      name: r.addedBy.name,
    },
    relatedTask: r.relatedTask
      ? {
          id: r.relatedTask.id,
          taskCode: r.relatedTask.taskCode,
          title: r.relatedTask.title,
        }
      : null,
    createdAt: r.createdAt.toISOString(),
  }));

  const projects = accessibleProjects.map((p) => ({
    id: p.id,
    name: p.name,
    projectCode: p.projectCode,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <WorkspaceResourceHub
        resources={resources}
        projects={projects}
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
