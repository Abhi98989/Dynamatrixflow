import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { SystemRole, TaskStatus, ProjectStatus, Prisma } from "@prisma/client";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  let projectsQuery: Prisma.ProjectWhereInput = { status: { not: ProjectStatus.ARCHIVED } };
  if (!isAdmin) {
    projectsQuery = { ...projectsQuery, members: { some: { userId: currentUser.id, removedAt: null } } };
  }

  const projects = await db.project.findMany({
    where: projectsQuery,
    include: { projectLead: { select: { name: true } }, tasks: { select: { id: true, status: true } } },
    take: 5, orderBy: { createdAt: 'desc' }
  });

  const projectList = projects.map(p => {
    let progress = 0;
    if (p.tasks.length > 0) {
      const completed = p.tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      progress = Math.round((completed / p.tasks.length) * 100);
    }
    return {
      id: p.id,
      name: p.name,
      projectCode: p.projectCode || `PROJ-${p.id.substring(0, 3).toUpperCase()}`,
      status: p.status,
      progress,
      lead: p.projectLead?.name || 'Unassigned',
    };
  });

  const activeProjectsCount = await db.project.count({ where: projectsQuery }) || 0;

  let tasksQuery: Prisma.TaskWhereInput = { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } };
  if (!isAdmin) tasksQuery = { ...tasksQuery, assigneeId: currentUser.id };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = await db.task.count({ where: { ...tasksQuery, dueDate: { lt: today } } }) || 0;
  
  // Real blocked and review count
  const blockedCount = await db.task.count({ where: { ...tasksQuery, status: TaskStatus.BLOCKED } }) || 0;
  const needsReviewCount = await db.task.count({ where: { ...tasksQuery, status: TaskStatus.IN_REVIEW } }) || 0;

  const upcomingDeadlines = await db.task.findMany({
    where: { ...tasksQuery, dueDate: { not: null, gte: today } },
    include: { project: { select: { name: true } } },
    orderBy: { dueDate: 'asc' }, take: 4,
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-[#101828] tracking-tight">Overview</h1>
            {isAdmin && <span className="px-2 py-0.5 rounded border border-[#E4E7EC] bg-[#F9FAFC] text-[#475467] text-[11px] font-medium tracking-wide">Command View</span>}
          </div>
          <p className="text-[#667085] mt-1 text-sm">Welcome back, {currentUser.name?.split(' ')[0] || "Abhishek"}. Here&apos;s what needs attention.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E4E7EC] rounded-md text-sm font-medium text-[#475467] hover:bg-[#F9FAFC] transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          {isAdmin && (
            <Link href="/projects/new" className="flex items-center gap-2 px-3 py-1.5 bg-[#5B5FEF] rounded-md text-sm font-medium text-white hover:bg-[#4C50D8] transition-colors">
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-5 border border-[#E4E7EC] flex flex-col justify-between h-32">
          <span className="text-[13px] font-medium text-[#667085]">Active Projects</span>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-[#101828] tracking-tight">{activeProjectsCount}</div>
            <div className="text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#16A34A] font-medium">In flight</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#E4E7EC] flex flex-col justify-between h-32">
          <span className="text-[13px] font-medium text-[#667085]">Overdue Tasks</span>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-[#DC2626] tracking-tight">{overdueCount}</div>
            <div className="text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#DC2626] font-medium">Action required</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#E4E7EC] flex flex-col justify-between h-32">
          <span className="text-[13px] font-medium text-[#667085]">Blocked Work</span>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-[#B45309] tracking-tight">{blockedCount}</div>
            <div className="text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#B45309] font-medium">Stalled items</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#E4E7EC] flex flex-col justify-between h-32">
          <span className="text-[13px] font-medium text-[#667085]">Pending Review</span>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-[#101828] tracking-tight">{needsReviewCount}</div>
            <div className="text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#475467] font-medium">Queued</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Project Progress */}
          <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EEF1F5] flex items-center justify-between bg-white">
              <h2 className="font-semibold text-[#101828] text-[15px]">Active Workstreams</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[12px] text-[#667085] font-medium border-b border-[#EEF1F5]">
                  <tr>
                    <th className="py-3 px-5 font-medium">Project</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium">Lead</th>
                    <th className="py-3 px-5 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {projectList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[13px] text-[#667085]">No active projects found.</td>
                    </tr>
                  ) : (
                    projectList.map((project) => (
                      <tr key={project.id} className="hover:bg-[#F9FAFC] transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-medium text-[#101828] text-[14px]">{project.name}</p>
                          <p className="text-[12px] text-[#667085] mt-0.5">{project.projectCode}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium ${
                            project.status === 'COMPLETED' ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' :
                            project.status === 'ON_HOLD' ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' :
                            'bg-[#F0F2F7] text-[#475467] border-[#E4E7EC]'
                          }`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-[#475467] text-[13px]">{project.lead}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 bg-[#F0F2F7] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#5B5FEF]" style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-[12px] font-medium text-[#667085] w-6">{project.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="flex flex-col gap-6">
          
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-[#EEF1F5] flex items-center justify-between">
              <h2 className="font-semibold text-[#101828] text-[15px]">Upcoming Deadlines</h2>
            </div>
            <div className="p-0">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-5 text-center text-[13px] text-[#667085]">No upcoming deadlines.</div>
              ) : (
                upcomingDeadlines.map((task, i) => (
                  <div key={task.id} className={`p-4 ${i !== upcomingDeadlines.length - 1 ? 'border-b border-[#EEF1F5]' : ''}`}>
                    <p className="font-medium text-[#101828] text-[14px] leading-tight mb-1">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-[#667085]">{task.project.name}</p>
                      <span className="text-[12px] font-medium text-[#DC2626]">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
