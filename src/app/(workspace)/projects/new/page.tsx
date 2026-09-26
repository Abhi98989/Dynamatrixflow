import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { redirect } from "next/navigation";
import { SystemRole } from "@prisma/client";
import { ArrowLeft, Save, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { createProjectAction } from "@/server/projects/actions";

export default async function NewProjectPage() {
  const currentUser = await requireActiveUser();
  if (currentUser.systemRole !== SystemRole.ADMIN && currentUser.systemRole !== SystemRole.PROJECT_LEAD) {
    redirect("/projects"); // Only Admin/Lead can create projects
  }

  // Fetch users for assignment
  const users = await db.user.findMany({
    select: { id: true, name: true, employeeId: true },
    where: { accountStatus: 'ACTIVE' }
  });

  return (
    <div className="w-full max-w-[800px] mx-auto pb-12">
      <div className="mb-8">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          Create New Project
        </h1>
        <p className="text-slate-500 mt-2 text-sm">Initialize a new workspace for client delivery or internal engineering.</p>
      </div>

      <form action={createProjectAction} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Project Identity</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Name *</label>
              <input id="name" name="name" type="text" required placeholder="e.g. Core API Gateway v3.0" className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm" />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="projectCode" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Code *</label>
              <input id="projectCode" name="projectCode" type="text" required placeholder="e.g. PROJ-882" className="w-full h-10 px-3 font-mono rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm uppercase" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="clientName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Client / Department</label>
            <input id="clientName" name="clientName" type="text" placeholder="e.g. Internal Infrastructure" className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm" />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Brief summary of project goals..." className="w-full p-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm resize-none"></textarea>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Status</label>
              <select id="status" name="status" className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white">
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="priority" className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</label>
              <select id="priority" name="priority" className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white">
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Deadline</label>
              <input id="deadline" name="deadline" type="date" className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm" />
            </div>

            <div className="space-y-2">
              <label htmlFor="projectLeadId" className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Lead</label>
              <select id="projectLeadId" name="projectLeadId" defaultValue={currentUser.id} className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white">
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link href="/projects" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
            Cancel
          </Link>
          <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-[#5B5FEF] text-white rounded-md text-sm font-semibold hover:bg-[#4C50D8] active:bg-[#4145C2] shadow-sm transition-colors">
            <Save className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}
