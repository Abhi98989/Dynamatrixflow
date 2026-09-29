"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { requireActiveUser, canManageProject } from "@/server/auth/authorization";
import { generateNextGuestId } from "./id-generator";
import { generateTemporaryPassword } from "@/features/employees/credential-generator";
import { hash } from "@node-rs/argon2";
import { SystemRole, AccountStatus, ProjectMemberRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const createGuestSchema = z.object({
  name: z.string().min(2, "Guest name must be at least 2 characters").trim(),
  email: z.string().email("Valid guest email address is required").trim().toLowerCase(),
  projectId: z.string().min(1, "Project is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export interface CreateGuestResult {
  error?: string;
  success?: boolean;
  guestCredentials?: {
    id: string;
    guestId: string;
    name: string;
    email: string;
    temporaryPassword: string;
    projectName: string;
    projectCode: string;
  };
}

export async function createGuestAction(
  _prevState: CreateGuestResult | undefined,
  formData: FormData
): Promise<CreateGuestResult> {
  const currentUser = await requireActiveUser();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    projectId: formData.get("projectId"),
    password: formData.get("password") || "",
  };

  const parsed = createGuestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid guest input details",
    };
  }

  const { name, email, projectId, password } = parsed.data;

  // Authorization check: Only Admin or Project Lead can invite a Guest to monitor
  const hasManageRights = await canManageProject(currentUser.id, projectId);
  if (!hasManageRights) {
    return {
      error: "You do not have permission to generate guest credentials for this project.",
    };
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, projectCode: true },
  });

  if (!project) {
    return { error: "Target project not found." };
  }

  // Check if an account already exists with this email
  const existingUser = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      projectMemberships: {
        where: { projectId, removedAt: null },
      },
    },
  });

  if (existingUser) {
    // If user already exists as an employee or has another role
    if ((existingUser.systemRole as string) !== "GUEST") {
      return {
        error: `User with email ${email} already exists as an organization ${existingUser.systemRole.toLowerCase()}. Cannot register as Guest.`,
      };
    }

    // If already has access to this project
    if (existingUser.projectMemberships.length > 0) {
      return {
        error: `Guest with email ${email} is already authorized for this project.`,
      };
    }

    // Guest exists from another project: grant project access
    await db.projectMember.create({
      data: {
        projectId,
        userId: existingUser.id,
        projectRole: ProjectMemberRole.VIEWER,
        addedById: currentUser.id,
      },
    });

    await db.activityLog.create({
      data: {
        actorId: currentUser.id,
        projectId,
        action: "GUEST_ACCESS_GRANTED",
        entityType: "USER",
        entityId: existingUser.id,
        metadata: {
          guestId: existingUser.employeeId,
          name: existingUser.name,
          email: existingUser.email || email,
        },
      },
    });

    revalidatePath(`/projects/${projectId}/team`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      guestCredentials: {
        id: existingUser.id,
        guestId: existingUser.employeeId,
        name: existingUser.name,
        email: existingUser.email || email,
        temporaryPassword: "(Existing password retained)",
        projectName: project.name,
        projectCode: project.projectCode,
      },
    };
  }

  // Generate unique sequential Guest ID (GST-001, etc.)
  const guestId = await generateNextGuestId();
  const rawPassword = password ? password.trim() : generateTemporaryPassword(10);
  const passwordHash = await hash(rawPassword);

  const newGuest = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        employeeId: guestId,
        passwordHash,
        systemRole: SystemRole.GUEST,
        accountStatus: AccountStatus.ACTIVE,
        position: "Guest Observer",
        mustChangePassword: false,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        projectRole: ProjectMemberRole.VIEWER,
        addedById: currentUser.id,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: currentUser.id,
        projectId,
        action: "GUEST_ACCESS_GRANTED",
        entityType: "USER",
        entityId: user.id,
        metadata: {
          guestId,
          name,
          email,
        },
      },
    });

    return user;
  });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);

  return {
    success: true,
    guestCredentials: {
      id: newGuest.id,
      guestId,
      name,
      email,
      temporaryPassword: rawPassword,
      projectName: project.name,
      projectCode: project.projectCode,
    },
  };
}

export async function revokeGuestAction(formData: FormData) {
  const currentUser = await requireActiveUser();
  const guestUserId = formData.get("guestUserId") as string;
  const projectId = formData.get("projectId") as string;

  if (!guestUserId || !projectId) {
    return { error: "Missing required parameters." };
  }

  const hasManageRights = await canManageProject(currentUser.id, projectId);
  if (!hasManageRights) {
    return { error: "Permission denied." };
  }

  const guestUser = await db.user.findUnique({
    where: { id: guestUserId },
    select: { id: true, systemRole: true, name: true, employeeId: true },
  });

  if (!guestUser || (guestUser.systemRole as string) !== "GUEST") {
    return { error: "Target user is not a guest." };
  }

  // Remove membership from project
  await db.projectMember.deleteMany({
    where: {
      projectId,
      userId: guestUserId,
    },
  });

  // Check if guest has remaining projects; if none, suspend account
  const remainingMemberships = await db.projectMember.count({
    where: { userId: guestUserId, removedAt: null },
  });

  if (remainingMemberships === 0) {
    await db.user.update({
      where: { id: guestUserId },
      data: { accountStatus: AccountStatus.SUSPENDED },
    });
  }

  await db.activityLog.create({
    data: {
      actorId: currentUser.id,
      projectId,
      action: "GUEST_ACCESS_REVOKED",
      entityType: "USER",
      entityId: guestUserId,
      metadata: {
        guestId: guestUser.employeeId,
        name: guestUser.name,
      },
    },
  });

  revalidatePath(`/projects/${projectId}/team`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/dashboard`);

  return { success: true };
}
