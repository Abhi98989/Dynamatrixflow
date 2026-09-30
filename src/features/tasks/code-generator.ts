import { db } from "@/server/db/client";

/**
 * Generates the next sequential task code for a project (e.g., EXP-001, EXP-002, PRJ-001).
 */
export async function generateNextTaskCode(projectId: string): Promise<string> {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { projectCode: true },
  });

  const parts = project.projectCode.split("-");
  let prefix = "TSK";
  if (parts.length >= 3 && parts[1]) {
    prefix = parts[1]; // e.g. EXP from DF-EXP-001
  } else if (parts.length === 2 && parts[1]) {
    prefix = parts[1];
  } else {
    prefix = project.projectCode.replace(/[^A-Z0-9]/g, "").slice(0, 4) || "TSK";
  }

  const codePrefix = `${prefix}-`;

  const existingTasks = await db.task.findMany({
    where: {
      projectId,
      taskCode: {
        startsWith: codePrefix,
      },
    },
    select: { taskCode: true },
  });

  let maxNum = 0;
  for (const t of existingTasks) {
    const numPart = t.taskCode.replace(codePrefix, "");
    const num = parseInt(numPart, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padded = nextNum.toString().padStart(3, "0");
  return `${codePrefix}${padded}`;
}
