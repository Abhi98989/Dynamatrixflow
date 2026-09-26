import { db } from '@/server/db/client';

/**
 * Generates the next sequential milestone code for a project (e.g., EXP-M1, EXP-M2, OPS-M1).
 */
export async function generateNextMilestoneCode(projectId: string): Promise<string> {
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { projectCode: true },
  });

  const parts = project.projectCode.split('-');
  let prefix = 'MS';
  if (parts.length >= 3 && parts[1]) {
    prefix = `${parts[1]}-M`; // e.g. EXP-M from DF-EXP-001
  } else if (parts.length === 2 && parts[1]) {
    prefix = `${parts[1]}-M`;
  } else {
    prefix = `${project.projectCode.replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PRJ'}-M`;
  }

  const existingMilestones = await db.milestone.findMany({
    where: {
      projectId,
      milestoneCode: {
        startsWith: prefix,
      },
    },
    select: { milestoneCode: true },
  });

  let maxNum = 0;
  for (const m of existingMilestones) {
    const numPart = m.milestoneCode.replace(prefix, '');
    const num = parseInt(numPart, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum}`;
}
