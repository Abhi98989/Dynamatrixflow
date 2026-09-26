"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import {
  requireAdmin,
  requireProjectManage,
} from "@/server/auth/authorization";
import { generateNextProjectCode } from "./code-generator";
import {
  ProjectStatus,
  Priority,
  ProjectMemberRole,
  NotificationType,
  AccountStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").trim(),
  prefix: z.string().max(5).optional(),
  clientName: z.string().optional(),
  description: z.string().optional(),
  projectLeadId: z.string().min(1, "Project Lead must be selected"),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
});

export interface CreateProjectResult {
  error?: string;
  success?: boolean;
  projectId?: string;
  projectCode?: string;
}

export async function createProjectAction(
  _prevState: CreateProjectResult | undefined,
  formData: FormData,
): Promise<CreateProjectResult> {
  const admin = await requireAdmin();

  const raw = {
    name: formData.get("name"),
    prefix: formData.get("prefix") || "",
    clientName: formData.get("clientName") || "",
    description: formData.get("description") || "",
    projectLeadId: formData.get("projectLeadId"),
    status: (formData.get("status") as ProjectStatus) || ProjectStatus.PLANNING,
    priority: (formData.get("priority") as Priority) || Priority.MEDIUM,
    startDate: formData.get("startDate") || "",
    deadline: formData.get("deadline") || "",
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid project details.",
    };
  }

  const {
    name,
    prefix,
    clientName,
    description,
    projectLeadId,
    status,
    priority,
    startDate,
    deadline,
  } = parsed.data;

  // Verify Project Lead is an active user
  const lead = await db.user.findUnique({
    where: { id: projectLeadId },
    select: { id: true, name: true, accountStatus: true },
  });

  if (!lead || lead.accountStatus !== AccountStatus.ACTIVE) {
    return {
      error: "The selected Project Lead does not exist or is inactive.",
    };
  }

  const projectCode = await generateNextProjectCode(prefix);

  const startParsed = startDate ? new Date(startDate) : null;
  const deadlineParsed = deadline ? new Date(deadline) : null;

  if (startParsed && deadlineParsed && deadlineParsed < startParsed) {
    return { error: "Project deadline cannot be earlier than start date." };
  }

  const project = await db.$transaction(async (tx) => {
    const newProject = await tx.project.create({
      data: {
        projectCode,
        name,
        description: description || null,
        clientName: clientName || null,
        status,
        priority,
        startDate: startParsed,
        deadline: deadlineParsed,
        projectLeadId: lead.id,
        createdById: admin.id,
      },
    });

    // Automatically add Project Lead as project member
    await tx.projectMember.create({
      data: {
        projectId: newProject.id,
        userId: lead.id,
        projectRole: ProjectMemberRole.PROJECT_LEAD,
        addedById: admin.id,
      },
    });

    // Notify Project Lead
    await tx.notification.create({
      data: {
        userId: lead.id,
        type: NotificationType.PROJECT_ASSIGNED,
        title: "Project Lead Assignment",
        message: `You have been assigned as Project Lead for "${newProject.name}" [${newProject.projectCode}].`,
        projectId: newProject.id,
        entityType: "Project",
        entityId: newProject.id,
      },
    });

    // Audit Log
    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: newProject.id,
        metadata: {
          projectCode: newProject.projectCode,
          name: newProject.name,
          projectLeadId: lead.id,
          priority: newProject.priority,
        },
      },
    });

    return newProject;
  });

  revalidatePath("/projects");

  return {
    success: true,
    projectId: project.id,
    projectCode: project.projectCode,
  };
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireProjectManage(projectId);

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const clientName = (formData.get("clientName") as string)?.trim() || null;
  const status = formData.get("status") as ProjectStatus;
  const priority = formData.get("priority") as Priority;
  const startDateStr = formData.get("startDate") as string;
  const deadlineStr = formData.get("deadline") as string;
  const newLeadId = (formData.get("projectLeadId") as string)?.trim();

  if (!name || name.length < 2) {
    return {
      success: false,
      error: "Project name must be at least 2 characters.",
    };
  }

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const deadline = deadlineStr ? new Date(deadlineStr) : null;

  if (startDate && deadline && deadline < startDate) {
    return {
      success: false,
      error: "Project deadline cannot be earlier than start date.",
    };
  }

  const existingProject = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectLeadId: true, projectCode: true, name: true },
  });

  if (!existingProject) {
    return { success: false, error: "Project not found." };
  }

  await db.$transaction(async (tx) => {
    let leadChanged = false;
    let targetLeadId = existingProject.projectLeadId;

    if (newLeadId && newLeadId !== existingProject.projectLeadId) {
      // Admin only can change project lead
      const admin = await db.user.findUnique({
        where: { id: actor.id },
        select: { systemRole: true },
      });
      if (admin?.systemRole !== "ADMIN") {
        throw new Error("Only an administrator can reassign the Project Lead.");
      }

      const nextLead = await tx.user.findUnique({
        where: { id: newLeadId, accountStatus: AccountStatus.ACTIVE },
      });
      if (!nextLead) {
        throw new Error("New lead user not found or inactive.");
      }

      leadChanged = true;
      targetLeadId = nextLead.id;

      // Ensure membership exists with LEAD role
      const member = await tx.projectMember.findFirst({
        where: { projectId, userId: nextLead.id },
      });

      if (member) {
        await tx.projectMember.update({
          where: { id: member.id },
          data: {
            projectRole: ProjectMemberRole.PROJECT_LEAD,
            removedAt: null,
          },
        });
      } else {
        await tx.projectMember.create({
          data: {
            projectId,
            userId: nextLead.id,
            projectRole: ProjectMemberRole.PROJECT_LEAD,
            addedById: actor.id,
          },
        });
      }

      // Notify new lead
      await tx.notification.create({
        data: {
          userId: nextLead.id,
          type: NotificationType.PROJECT_ASSIGNED,
          title: "Project Lead Reassigned",
          message: `You are now the Project Lead for "${name}" [${existingProject.projectCode}].`,
          projectId,
          entityType: "Project",
          entityId: projectId,
        },
      });
    }

    await tx.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        clientName,
        status,
        priority,
        startDate,
        deadline,
        projectLeadId: targetLeadId,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: "PROJECT_UPDATED",
        entityType: "Project",
        entityId: projectId,
        metadata: {
          projectCode: existingProject.projectCode,
          name,
          status,
          priority,
          leadChanged,
        },
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  return { success: true };
}

export async function archiveProjectAction(
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectCode: true, name: true },
  });

  if (!project) {
    return { success: false, error: "Project not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "PROJECT_ARCHIVED",
        entityType: "Project",
        entityId: projectId,
        metadata: {
          projectCode: project.projectCode,
          name: project.name,
        },
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  return { success: true };
}

export async function addProjectMemberAction(
  projectId: string,
  targetUserId: string,
  projectRole: ProjectMemberRole,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireProjectManage(projectId);

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, accountStatus: true },
  });

  if (!targetUser || targetUser.accountStatus !== AccountStatus.ACTIVE) {
    return { success: false, error: "User is not an active team member." };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, projectCode: true },
  });

  if (!project) {
    return { success: false, error: "Project not found." };
  }

  await db.$transaction(async (tx) => {
    const existing = await tx.projectMember.findFirst({
      where: { projectId, userId: targetUserId },
    });

    if (existing) {
      if (existing.removedAt === null) {
        throw new Error(
          "This employee is already an active member of this project.",
        );
      }
      // Re-activate member
      await tx.projectMember.update({
        where: { id: existing.id },
        data: {
          removedAt: null,
          projectRole,
          joinedAt: new Date(),
          addedById: actor.id,
        },
      });
    } else {
      await tx.projectMember.create({
        data: {
          projectId,
          userId: targetUserId,
          projectRole,
          addedById: actor.id,
        },
      });
    }

    // Notify member
    await tx.notification.create({
      data: {
        userId: targetUserId,
        type: NotificationType.PROJECT_ASSIGNED,
        title: "Added to Project",
        message: `You were added to "${project.name}" [${project.projectCode}] as ${projectRole}.`,
        projectId,
        entityType: "Project",
        entityId: projectId,
      },
    });

    // Audit log
    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: "PROJECT_MEMBER_ADDED",
        entityType: "Project",
        entityId: projectId,
        metadata: {
          targetUserId,
          targetUserName: targetUser.name,
          projectRole,
        },
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectMemberAction(
  projectId: string,
  membershipId: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireProjectManage(projectId);

  const member = await db.projectMember.findUnique({
    where: { id: membershipId },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, projectLeadId: true, projectCode: true } },
    },
  });

  if (!member || member.projectId !== projectId) {
    return { success: false, error: "Project membership not found." };
  }

  if (member.userId === member.project.projectLeadId) {
    return {
      success: false,
      error: "Cannot remove the Project Lead. Reassign the lead role first.",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.projectMember.update({
      where: { id: membershipId },
      data: { removedAt: new Date() },
    });

    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: "PROJECT_MEMBER_REMOVED",
        entityType: "Project",
        entityId: projectId,
        metadata: {
          targetUserId: member.userId,
          targetUserName: member.user.name,
        },
      },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
