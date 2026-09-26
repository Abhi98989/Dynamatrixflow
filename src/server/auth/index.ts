import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Server-side helper to get the currently authenticated user session.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
