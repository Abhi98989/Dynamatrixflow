import { db } from "@/server/db/client";
import { requireActiveUser, canManageProject } from "@/server/auth/authorization";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProjectStatus, Priority } from "@prisma/client";

interface Props { params: Promise<{ id: string }> }

async function updateProjectAction(formData: FormData) {
  "use server";
  const projectId = formData.get("projectId") as string;
  const currentUser = await requireActiveUser();
  const canManage = await canManageProject(currentUser.id, projectId);
  if (!canManage) throw new Error("Unauthorized");

  await db.project.update({
    where: { id: projectId },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      clientName: (formData.get("clientName") as string) || null,
      status: formData.get("status") as ProjectStatus,
      priority: formData.get("priority") as Priority,
      deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string) : null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/settings`);
}

export default async function SettingsPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const canManage = await canManageProject(currentUser.id, projectId);
  if (!canManage) notFound();

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true, name: true, projectCode: true, description: true, clientName: true,
      status: true, priority: true, deadline: true, startDate: true, technologyTags: true,
    },
  });
  if (!project) notFound();

  return (
    <div className="max-w-[640px] space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[#101828]">Project Settings</h2>
        <p className="text-[12px] text-[#667085] mt-0.5">Update project details and configuration</p>
      </div>

      <form action={updateProjectAction} className="bg-white rounded-lg border border-[#E4E7EC] p-5 space-y-6">
        <input type="hidden" name="projectId" value={project.id} />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Project Name</label>
            <input id="name" name="name" type="text" required defaultValue={project.name} className="w-full h-9 px-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20 text-[13px] text-[#101828]" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="clientName" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Client</label>
            <input id="clientName" name="clientName" type="text" defaultValue={project.clientName || ""} className="w-full h-9 px-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20 text-[13px] text-[#101828]" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={project.description || ""} className="w-full p-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20 text-[13px] text-[#101828] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Status</label>
              <select id="status" name="status" defaultValue={project.status} className="w-full h-9 px-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] text-[13px] bg-white text-[#101828]">
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Priority</label>
              <select id="priority" name="priority" defaultValue={project.priority} className="w-full h-9 px-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] text-[13px] bg-white text-[#101828]">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="deadline" className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Deadline</label>
            <input id="deadline" name="deadline" type="date" defaultValue={project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : ""} className="w-full h-9 px-3 rounded-md border border-[#E4E7EC] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20 text-[13px] text-[#101828]" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#F2F4F7]">
          <span className="text-[11px] font-mono text-[#98A2B3]">{project.projectCode}</span>
          <button type="submit" className="inline-flex items-center px-4 h-8 bg-[#5B5FEF] text-white rounded-md text-[13px] font-semibold hover:bg-[#4C50D8] transition-colors">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
