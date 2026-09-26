"use server";

import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { db } from "@/server/db/client";
import { auth, signIn, signOut } from "./index";
import { authenticateUser } from "./config";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const employeeId = (formData.get("employeeId") as string)?.trim();
  const password = formData.get("password") as string;

  if (!employeeId || !password) {
    return { error: "Please enter both Employee ID and Password." };
  }

  // Pre-validate credentials and determine redirect destination
  let redirectTo = "/dashboard";
  try {
    const verifiedUser = await authenticateUser({ employeeId, password });
    if (!verifiedUser) {
      return { error: "Invalid Employee ID or password." };
    }
    if (verifiedUser.mustChangePassword) {
      redirectTo = "/change-password";
    }
  } catch (err) {
    return { error: (err as Error).message || "Authentication error." };
  }

  try {
    await signIn("credentials", {
      employeeId,
      password,
      redirectTo,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Employee ID or password." };
        default:
          return { error: "Authentication failed. Please verify credentials." };
      }
    }
    // Re-throw Next.js redirect exceptions
    throw error;
  }
}

export async function changePasswordAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawNew = formData.get("newPassword");
  const rawConfirm = formData.get("confirmPassword");

  const parsed = changePasswordSchema.safeParse({
    newPassword: rawNew,
    confirmPassword: rawConfirm,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message || "Invalid password submission." };
  }

  const { newPassword } = parsed.data;
  const newHash = await hash(newPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        actorId: session.user.id,
        action: "PASSWORD_RESET",
        entityType: "User",
        entityId: session.user.id,
        metadata: {
          employeeId: session.user.employeeId,
          reason: "Forced first-login or self password change",
        },
      },
    });
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
