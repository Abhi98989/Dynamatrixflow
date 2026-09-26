import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verify } from "@node-rs/argon2";
import { db } from "@/server/db/client";
import { AccountStatus, SystemRole } from "@prisma/client";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

const credentialsSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export async function authenticateUser(
  credentials: Record<string, unknown> | undefined,
) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }

  const { employeeId, password } = parsed.data;

  // Brute-force rate limiting
  const rateLimitKey = `login:${employeeId.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, 5, 900);
  if (!rateCheck.allowed) {
    throw new Error(
      `Too many failed attempts. Account temporarily locked. Try again in ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes.`,
    );
  }

  const user = await db.user.findFirst({
    where: {
      employeeId: {
        equals: employeeId,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    return null;
  }

  // Account status check
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    throw new Error(
      "Your account is inactive or suspended. Please contact an administrator.",
    );
  }

  // Verify password
  const isPasswordValid = await verify(user.passwordHash, password);
  if (!isPasswordValid) {
    return null;
  }

  // Reset rate limit on successful credentials
  resetRateLimit(rateLimitKey);

  // Update last login timestamp asynchronously
  db.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    .catch((err) => console.error("Failed to update lastLoginAt:", err));

  return {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    systemRole: user.systemRole,
    accountStatus: user.accountStatus,
    position: user.position,
    mustChangePassword: user.mustChangePassword,
  };
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return authenticateUser(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.name = user.name;
        token.email = user.email;
        token.systemRole = user.systemRole;
        token.accountStatus = user.accountStatus;
        token.position = user.position;
        token.mustChangePassword = user.mustChangePassword;
      }

      if (trigger === "update" && session?.user) {
        if (typeof session.user.mustChangePassword === "boolean") {
          token.mustChangePassword = session.user.mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.employeeId = token.employeeId as string;
        session.user.systemRole = token.systemRole as SystemRole;
        session.user.accountStatus = token.accountStatus as AccountStatus;
        session.user.position = token.position as string | null | undefined;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
};
