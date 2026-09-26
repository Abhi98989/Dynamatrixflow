"use server";

import { createProjectAction as robustCreateProject } from "@/features/projects/actions";
import { redirect } from "next/navigation";

export async function createProjectAction(formData: FormData) {
  const result = await robustCreateProject(undefined, formData);
  if (result.error) {
    throw new Error(result.error);
  }
  if (result.projectId) {
    redirect(`/projects/${result.projectId}`);
  } else {
    redirect("/projects");
  }
}
