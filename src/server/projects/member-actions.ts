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
  revalidatePath("/chat");
}

export async function updateProjectMemberRoleAction(formData: FormData) {
  const currentUser = await requireActiveUser();
  const memberId = formData.get("memberId") as string;
  const projectId = formData.get("projectId") as string;
  const newRole = formData.get("newRole") as ProjectMemberRole;

  if (!memberId || !projectId || !newRole) {
    throw new Error("Missing required fields");
  }

  const canManage = await canManageProject(currentUser.id, projectId);
  if (!canManage) throw new Error("Unauthorized");

  const member = await db.projectMember.findUnique({
    where: { id: memberId },
    include: { user: { select: { id: true, name: true, employeeId: true } } },
  });

  if (!member || member.projectId !== projectId) {
    throw new Error("Project member not found");
  }

  const updated = await db.projectMember.update({
    where: { id: memberId },
    data: { projectRole: newRole },
  });

  await db.activityLog.create({
    data: {
      actorId: currentUser.id,
      action: "PROJECT_MEMBER_ROLE_UPDATED",
      entityType: "ProjectMember",
      entityId: memberId,
      metadata: {
        projectId,
        userId: member.userId,
        memberName: member.user.name,
        previousRole: member.projectRole,
        newRole,
      },
    },
  });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/chat");
  return { success: true, projectRole: updated.projectRole };
}
