"use server";

import { db } from "@/server/db/client";
import {
  requireActiveUser,
  canManageProject,
} from "@/server/auth/authorization";
import { ProjectMemberRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addMemberAction(formData: FormData) {
  const currentUser = await requireActiveUser();
  const projectId = formData.get("projectId") as string;
  const userId = formData.get("userId") as string;
  const projectRole = formData.get("projectRole") as ProjectMemberRole;

  if (!projectId || !userId) throw new Error("Missing required fields");

  const canManage = await canManageProject(currentUser.id, projectId);
  if (!canManage) throw new Error("Unauthorized");

  // Check if already a member
  const existing = await db.projectMember.findFirst({
    where: { projectId, userId, removedAt: null },
  });
  if (existing) throw new Error("User is already a member");

  await db.projectMember.create({
    data: {
      projectId,
      userId,
      projectRole: projectRole || ProjectMemberRole.DEVELOPER,
      addedById: currentUser.id,
    },
  });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
}

export async function removeMemberAction(formData: FormData) {
  const currentUser = await requireActiveUser();
  const memberId = formData.get("memberId") as string;
  const projectId = formData.get("projectId") as string;

  if (!memberId || !projectId) throw new Error("Missing required fields");

  const canManage = await canManageProject(currentUser.id, projectId);
  if (!canManage) throw new Error("Unauthorized");

  await db.projectMember.update({
    where: { id: memberId },
    data: { removedAt: new Date() },
  });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
}
