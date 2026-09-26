"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { requireAdmin, requireActiveUser } from "@/server/auth/authorization";
import { generateNextEmployeeId } from "./id-generator";
import { generateTemporaryPassword } from "./credential-generator";
import { hash } from "@node-rs/argon2";
import { SystemRole, AccountStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const createEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  position: z.string().min(2, "Position is required").trim(),
  systemRole: z.nativeEnum(SystemRole),
});

export interface CreateEmployeeResult {
  error?: string;
  success?: boolean;
  temporaryCredentials?: {
    employeeId: string;
    temporaryPassword: string;
    name: string;
  };
}

export async function createEmployeeAction(
  _prevState: CreateEmployeeResult | undefined,
  formData: FormData,
): Promise<CreateEmployeeResult> {
  const admin = await requireAdmin();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email") || "",
    position: formData.get("position"),
    systemRole: formData.get("systemRole"),
  };

  const parsed = createEmployeeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid employee details",
    };
  }

  const { name, email, position, systemRole } = parsed.data;

  // Check unique email if provided
  if (email) {
    const existing = await db.user.findFirst({ where: { email } });
    if (existing) {
      return { error: "An employee with this email address already exists." };
    }
  }

  const employeeId = await generateNextEmployeeId();
  const temporaryPassword = generateTemporaryPassword(12);
  const passwordHash = await hash(temporaryPassword);

  const newUser = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        employeeId,
        name,
        email: email || null,
        position,
        systemRole,
        passwordHash,
        mustChangePassword: true,
        accountStatus: AccountStatus.ACTIVE,
        createdById: admin.id,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: admin.id,
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

  revalidatePath("/team");

  return {
    success: true,
    temporaryCredentials: {
      employeeId: newUser.employeeId,
      temporaryPassword,
      name: newUser.name,
    },
  };
}

export interface ResetPasswordResult {
  error?: string;
  success?: boolean;
  temporaryPassword?: string;
}

export async function resetEmployeePasswordAction(
  targetUserId: string,
): Promise<ResetPasswordResult> {
  const admin = await requireAdmin();

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, employeeId: true, name: true },
  });

  if (!target) {
    return { error: "Employee not found." };
  }

  const temporaryPassword = generateTemporaryPassword(12);
  const newHash = await hash(temporaryPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: true,
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: target.id,
        metadata: {
          employeeId: target.employeeId,
          initiatedByAdmin: true,
        },
      },
    });
  });

  revalidatePath(`/team/${target.employeeId}`);
  revalidatePath("/team");

  return {
    success: true,
    temporaryPassword,
  };
}

export async function updateEmployeeStatusAction(
  targetUserId: string,
  newStatus: AccountStatus,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  if (admin.id === targetUserId) {
    return {
      success: false,
      error: "You cannot change your own account status.",
    };
  }

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, employeeId: true, accountStatus: true },
  });

  if (!target) {
    return { success: false, error: "Employee not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { accountStatus: newStatus },
    });

    await tx.activityLog.create({
      data: {
        actorId: admin.id,
        action:
          newStatus === AccountStatus.INACTIVE
            ? "EMPLOYEE_DEACTIVATED"
            : "EMPLOYEE_STATUS_CHANGED",
        entityType: "User",
        entityId: target.id,
        metadata: {
          employeeId: target.employeeId,
          previousStatus: target.accountStatus,
          newStatus,
        },
      },
    });
  });

  revalidatePath(`/team/${target.employeeId}`);
  revalidatePath("/team");

  return { success: true };
}

export async function updateOwnProfileAction(formData: FormData) {
  const currentUser = await requireActiveUser();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name || name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  if (email && email !== currentUser.email) {
    const existing = await db.user.findFirst({
      where: { email, NOT: { id: currentUser.id } },
    });
    if (existing) {
      return { error: "Email is already in use." };
    }
  }

  await db.user.update({
    where: { id: currentUser.id },
    data: {
      name,
      email: email || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function changeOwnPasswordAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const currentUser = await requireActiveUser();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  // Fetch full user record to verify current password
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, passwordHash: true, employeeId: true },
  });

  if (!user) {
    return { error: "User not found." };
  }

  const { verify } = await import("@node-rs/argon2");
  const isMatch = await verify(user.passwordHash, currentPassword);
  if (!isMatch) {
    return { error: "Current password is incorrect." };
  }

  const newHash = await hash(newPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
        metadata: {
          employeeId: user.employeeId,
          type: "SELF_SERVICE",
        },
      },
    });
  });

  revalidatePath("/profile");
  return { success: true };
}
