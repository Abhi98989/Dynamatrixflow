"use server";

import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { SystemRole, ProjectStatus, Priority, ProjectMemberRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData) {
  const currentUser = await requireActiveUser();
  if (currentUser.systemRole !== SystemRole.ADMIN && currentUser.systemRole !== SystemRole.PROJECT_LEAD) {
    throw new Error("Unauthorized to create projects");
  }

  const name = formData.get("name") as string;
  const projectCode = formData.get("projectCode") as string;
  const clientName = formData.get("clientName") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as ProjectStatus;
  const priority = formData.get("priority") as Priority;
  const deadline = formData.get("deadline") as string;
  const projectLeadId = formData.get("projectLeadId") as string;

  if (!name || !projectCode) {
    throw new Error("Missing required fields");
  }

  const project = await db.project.create({
    data: {
      name,
      projectCode,
      clientName: clientName || null,
      description: description || null,
      status: status || ProjectStatus.PLANNING,
      priority: priority || Priority.MEDIUM,
      deadline: deadline ? new Date(deadline) : null,
      projectLeadId: projectLeadId || currentUser.id,
      createdById: currentUser.id,
    }
  });

  // Automatically add the creator and lead as members
  await db.projectMember.createMany({
    data: [
      { projectId: project.id, userId: currentUser.id, projectRole: ProjectMemberRole.PROJECT_LEAD, addedById: currentUser.id },
      // If lead is different from creator, add them too
      ...(projectLeadId && projectLeadId !== currentUser.id ? [{ projectId: project.id, userId: projectLeadId, projectRole: ProjectMemberRole.PROJECT_LEAD, addedById: currentUser.id }] : [])
    ],
    skipDuplicates: true
  });

  revalidatePath("/projects");
  redirect("/projects");
}
