import { db } from "@/server/db/client";

/**
 * Generates the next sequential unique Employee ID in the format DMS-###.
 * Scans all existing IDs matching DMS-###, finds the maximum integer, and increments by 1.
 * Default starting ID if none exist is DMS-001.
 */
export async function generateNextEmployeeId(): Promise<string> {
  const users = await db.user.findMany({
    select: { employeeId: true },
    where: {
      employeeId: {
        startsWith: "DMS-",
      },
    },
  });

  let maxNum = 0;

  for (const user of users) {
    const match = user.employeeId.match(/^DMS-(\d+)$/i);
    if (match?.[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0");
  return `DMS-${padded}`;
}
