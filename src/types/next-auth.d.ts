import type { DefaultSession } from "next-auth";
import type { SystemRole, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    employeeId: string;
    name: string;
    email?: string | null;
    systemRole: SystemRole;
    accountStatus: AccountStatus;
    position?: string | null;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      employeeId: string;
      systemRole: SystemRole;
      accountStatus: AccountStatus;
      position?: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    employeeId: string;
    systemRole: SystemRole;
    accountStatus: AccountStatus;
    position?: string | null;
    mustChangePassword: boolean;
  }
}
