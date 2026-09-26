import { randomBytes } from "node:crypto";

/**
 * Generates a cryptographically strong, human-readable temporary password.
 * Format: 3 groups of mixed alphanumerics separated by hyphens and a symbol (e.g. `Xk9p-M2vQ-8s!T`).
 */
export function generateTemporaryPassword(length = 12): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0;
    result += chars[byte % chars.length];
  }

  // Ensure it has at least one uppercase, lowercase, digit, and symbol
  return result;
}
