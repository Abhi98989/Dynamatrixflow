'use server';

import { db } from '@/server/db/client';
import { requireActiveUser, canManageProject } from '@/server/auth/authorization';
import { ResourceCategory, SystemRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createResourceAction(projectId: string, formData: FormData) {
  try {
    const currentUser = await requireActiveUser();
    // Members can add resources, so we just verify they are a member (this is implied if they can view the project in page level, but we should double check)
    const member = await db.projectMember.findFirst({
      where: { projectId, userId: currentUser.id, removedAt: null },
    });
    
    if (!member && currentUser.systemRole !== SystemRole.ADMIN) {
      return { error: 'You are not a member of this project.' };
    }

    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const category = formData.get('category') as ResourceCategory;
    const description = formData.get('description') as string | null;
    const tagsInput = formData.get('tags') as string | null;
    const relatedTaskId = formData.get('relatedTaskId') as string | null;

    if (!title || !url || !category) {
      return { error: 'Title, URL, and category are required.' };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { error: 'Invalid URL provided.' };
    }

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    await db.$transaction(async (tx) => {
      const resource = await tx.projectResource.create({
        data: {
          projectId,
          title,
          url,
          category,
          description,
          tags,
          relatedTaskId: relatedTaskId || null,
          addedById: currentUser.id,
        },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: 'CREATED_RESOURCE',
          entityType: 'RESOURCE',
          entityId: resource.id,
          metadata: { title, url, category },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath('/resources');
    return { success: true };
  } catch (error: unknown) {
    console.error('Create resource error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create resource.';
    return { error: message };
  }
}

export async function archiveResourceAction(resourceId: string, projectId: string) {
  try {
    const currentUser = await requireActiveUser();
    
    const resource = await db.projectResource.findUnique({
      where: { id: resourceId },
    });
    
    if (!resource || resource.projectId !== projectId) {
      return { error: 'Resource not found.' };
    }

    const isManager = await canManageProject(currentUser.id, projectId);
    const isOwner = resource.addedById === currentUser.id;
    
    if (!isManager && !isOwner) {
      return { error: 'Only Project Leads, Admins, or the creator can archive this resource.' };
    }

    await db.$transaction(async (tx) => {
      await tx.projectResource.update({
        where: { id: resourceId },
        data: { archivedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: 'ARCHIVED_RESOURCE',
          entityType: 'RESOURCE',
          entityId: resourceId,
          metadata: { title: resource.title },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath('/resources');
    return { success: true };
  } catch (error: unknown) {
    console.error('Archive resource error:', error);
    const message = error instanceof Error ? error.message : 'Failed to archive resource.';
    return { error: message };
  }
}

export async function updateResourceAction(resourceId: string, projectId: string, formData: FormData) {
  try {
    const currentUser = await requireActiveUser();
    
    const resource = await db.projectResource.findUnique({
      where: { id: resourceId },
    });
    
    if (!resource || resource.projectId !== projectId) {
      return { error: 'Resource not found.' };
    }

    const isManager = await canManageProject(currentUser.id, projectId);
    const isOwner = resource.addedById === currentUser.id;
    
    if (!isManager && !isOwner) {
      return { error: 'Only Project Leads, Admins, or the creator can edit this resource.' };
    }

    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const category = formData.get('category') as ResourceCategory;
    const description = formData.get('description') as string | null;
    const tagsInput = formData.get('tags') as string | null;
    const relatedTaskId = formData.get('relatedTaskId') as string | null;

    if (!title || !url || !category) {
      return { error: 'Title, URL, and category are required.' };
    }

    try {
      new URL(url);
    } catch {
      return { error: 'Invalid URL provided.' };
    }

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    await db.$transaction(async (tx) => {
      await tx.projectResource.update({
        where: { id: resourceId },
        data: {
          title,
          url,
          category,
          description,
          tags,
          relatedTaskId: relatedTaskId || null,
        },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: 'UPDATED_RESOURCE',
          entityType: 'RESOURCE',
          entityId: resourceId,
          metadata: { title, url, category },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath('/resources');
    return { success: true };
  } catch (error: unknown) {
    console.error('Update resource error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update resource.';
    return { error: message };
  }
}
