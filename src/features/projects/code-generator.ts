import { db } from "@/server/db/client";

/**
 * Generates a unique sequential project code in the format: DF-[PREFIX]-[NUM]
 * e.g., DF-PRJ-001, DF-EXP-001, DF-NEX-001.
 */
export async function generateNextProjectCode(
  rawPrefix?: string,
): Promise<string> {
  let prefix = (rawPrefix || "PRJ")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, "");
  if (!prefix || prefix.length < 2) {
    prefix = "PRJ";
  }
  if (prefix.length > 5) {
    prefix = prefix.slice(0, 5);
  }

  const codePatternPrefix = `DF-${prefix}-`;

  const existingProjects = await db.project.findMany({
    where: {
      projectCode: {
        startsWith: codePatternPrefix,
      },
    },
    select: { projectCode: true },
  });

  let maxNum = 0;
  for (const p of existingProjects) {
    const suffix = p.projectCode.replace(codePatternPrefix, "");
    const num = parseInt(suffix, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padded = nextNum.toString().padStart(3, "0");
  return `${codePatternPrefix}${padded}`;
}
