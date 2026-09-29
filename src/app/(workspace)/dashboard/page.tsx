import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { SystemRole, TaskStatus, ProjectStatus, Prisma } from "@prisma/client";
import {
  Download,
  Plus,
  Activity,
  FolderPlus,
  CheckSquare,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { GuestMonitorView, type GuestProjectData } from "@/features/guests/guest-monitor-view";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const currentUser = await requireActiveUser();

  const isGuest = (currentUser.systemRole as string) === "GUEST";
  if (isGuest) {
    const guestProjects = await db.project.findMany({
      where: {
        status: { not: ProjectStatus.ARCHIVED },
        members: { some: { userId: currentUser.id, removedAt: null } },
      },
      include: {
        projectLead: { select: { name: true, position: true } },
        tasks: {
          where: { archivedAt: null },
          select: {
            id: true,
            taskCode: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            progress: true,
            dueDate: true,
            completedAt: true,
            assignee: { select: { name: true, position: true } },
          },
          orderBy: { dueDate: "asc" },
        },
        milestones: {
          where: { archivedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            deadline: true,
            progressOverride: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        resources: {
          where: { archivedAt: null },
          select: {
            id: true,
            title: true,
            url: true,
            category: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedProjects: GuestProjectData[] = guestProjects.map((p) => ({
      id: p.id,
      name: p.name,
      projectCode: p.projectCode,
      description: p.description,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      deadline: p.deadline ? p.deadline.toISOString() : null,
      projectLead: p.projectLead,
      tasks: p.tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      })),
      milestones: p.milestones.map((m) => ({
        ...m,
        deadline: m.deadline ? m.deadline.toISOString() : null,
      })),
      resources: p.resources.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    }));

    return (
      <GuestMonitorView
        guestName={currentUser.name || "Guest Observer"}
        guestId={currentUser.employeeId}
        projects={serializedProjects}
      />
    );
  }

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

  // Health computation
  const allProjectsForHealth = await db.project.findMany({
    where: projectsQuery,
    select: {
      id: true,
      status: true,
      tasks: {
        where: {
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          dueDate: { lt: today },
        },
        select: { id: true },
      },
    },
  });

  const totalHealthProjects = allProjectsForHealth.length || 1;
  const completedProjectsCount = allProjectsForHealth.filter(p => p.status === ProjectStatus.COMPLETED).length;
  const atRiskProjectsCount = allProjectsForHealth.filter(p => p.status !== ProjectStatus.COMPLETED && p.tasks.length > 0).length;
  const onTrackProjectsCount = Math.max(0, allProjectsForHealth.length - completedProjectsCount - atRiskProjectsCount);

  const completedPct = Math.round((completedProjectsCount / totalHealthProjects) * 100);
  const atRiskPct = Math.round((atRiskProjectsCount / totalHealthProjects) * 100);
  const onTrackPct = Math.max(0, 100 - completedPct - atRiskPct);

  // Velocity computation (completed deliverables in the last 7 days)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeekCount = await db.task.count({
    where: {
      status: TaskStatus.COMPLETED,
      completedAt: { gte: sevenDaysAgo },
      ...(isAdmin ? {} : { assigneeId: currentUser.id }),
    },
  }) || 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-[#101828] tracking-tight">Good morning, {currentUser.name?.split(' ')[0] || "Abhishek"}</h1>
            {isAdmin && <span className="px-2 py-0.5 rounded border border-[#E4E7EC] bg-[#F9FAFC] text-[#475467] text-[11px] font-medium tracking-wide">Command View</span>}
          </div>
          <p className="text-[#667085] mt-1 text-sm">Welcome back. Here&apos;s what needs attention.</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#E4E7EC] flex flex-col justify-between h-28 sm:h-32">
          <span className="text-[13px] font-medium text-[#667085]">Active Projects</span>
          <div className="mt-auto">
            <div className="text-3xl font-semibold text-[#101828] tracking-tight">{activeProjectsCount}</div>
            <div className="text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#16A34A] font-medium">In flight</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#E4E7EC] flex flex-col justify-between h-28 sm:h-32">
          <span className="text-[13px] font-medium text-[#667085]">Overdue Tasks</span>
          <div className="mt-auto">
            <div className="text-2xl sm:text-3xl font-semibold text-[#DC2626] tracking-tight">{overdueCount}</div>
            <div className="text-[12px] sm:text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#DC2626] font-medium">Action required</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#E4E7EC] flex flex-col justify-between h-28 sm:h-32">
          <span className="text-[13px] font-medium text-[#667085]">Blocked Work</span>
          <div className="mt-auto">
            <div className="text-2xl sm:text-3xl font-semibold text-[#B45309] tracking-tight">{blockedCount}</div>
            <div className="text-[12px] sm:text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#B45309] font-medium">Stalled items</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-[#E4E7EC] flex flex-col justify-between h-28 sm:h-32">
          <span className="text-[13px] font-medium text-[#667085]">Pending Review</span>
          <div className="mt-auto">
            <div className="text-2xl sm:text-3xl font-semibold text-[#101828] tracking-tight">{needsReviewCount}</div>
            <div className="text-[12px] sm:text-[13px] text-[#667085] mt-1 flex items-center gap-2">
              <span className="text-[#475467] font-medium">Queued</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Health & Delivery Momentum Bar */}
      <div className="bg-white rounded-lg p-5 border border-[#E4E7EC] mb-6 sm:mb-8 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#5B5FEF]" />
              <h2 className="text-sm font-bold text-[#101828] tracking-tight">
                Portfolio Health & Delivery Momentum
              </h2>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Live status distribution across {allProjectsForHealth.length} tracked workstreams.
            </p>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold self-start sm:self-auto">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{completedThisWeekCount} deliverables completed this week</span>
          </div>
        </div>

        {/* Multi-Segment Horizontal Distribution Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/60">
          {onTrackPct > 0 && (
            <div
              className="h-full bg-[#5B5FEF] rounded-full transition-all duration-500"
              style={{ width: `${onTrackPct}%` }}
              title={`On Track: ${onTrackProjectsCount} (${onTrackPct}%)`}
            />
          )}
          {atRiskPct > 0 && (
            <div
              className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
              style={{ width: `${atRiskPct}%` }}
              title={`At Risk / Overdue: ${atRiskProjectsCount} (${atRiskPct}%)`}
            />
          )}
          {completedPct > 0 && (
            <div
              className="h-full bg-[#10B981] rounded-full transition-all duration-500"
              style={{ width: `${completedPct}%` }}
              title={`Completed: ${completedProjectsCount} (${completedPct}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#5B5FEF]" />
              <span className="font-medium text-[#344054]">On Track:</span>
              <span className="font-bold text-[#101828]">{onTrackProjectsCount}</span>
              <span className="text-[#98A2B3]">({onTrackPct}%)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#EF4444]" />
              <span className="font-medium text-[#344054]">At Risk:</span>
              <span className="font-bold text-[#DC2626]">{atRiskProjectsCount}</span>
              <span className="text-[#98A2B3]">({atRiskPct}%)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#10B981]" />
              <span className="font-medium text-[#344054]">Completed:</span>
              <span className="font-bold text-[#15803D]">{completedProjectsCount}</span>
              <span className="text-[#98A2B3]">({completedPct}%)</span>
            </div>
          </div>

          <Link
            href="/projects"
            className="text-xs font-semibold text-[#5B5FEF] hover:text-[#4C50D8] flex items-center gap-1 transition-colors"
          >
            Manage projects
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8 max-w-7xl mx-auto">
        <Link
          href={isAdmin ? "/projects/new" : "/projects"}
          className="p-3 bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors flex items-center gap-3 group"
        >
          <div className="size-8 rounded-md bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#5B5FEF] group-hover:scale-105 transition-transform">
            <FolderPlus className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#101828] group-hover:text-[#5B5FEF] transition-colors truncate">
              {isAdmin ? "New Project" : "All Projects"}
            </p>
            <p className="text-[11px] text-[#667085] truncate">Create or browse</p>
          </div>
        </Link>

        <Link
          href="/my-tasks"
          className="p-3 bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors flex items-center gap-3 group"
        >
          <div className="size-8 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <CheckSquare className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#101828] group-hover:text-[#5B5FEF] transition-colors truncate">
              My Tasks
            </p>
            <p className="text-[11px] text-[#667085] truncate">View deliverables</p>
          </div>
        </Link>

        <Link
          href="/team"
          className="p-3 bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors flex items-center gap-3 group"
        >
          <div className="size-8 rounded-md bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
            <Users className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#101828] group-hover:text-[#5B5FEF] transition-colors truncate">
              Team Directory
            </p>
            <p className="text-[11px] text-[#667085] truncate">Roster & guests</p>
          </div>
        </Link>

        <Link
          href="/notifications"
          className="p-3 bg-white hover:bg-slate-50 border border-[#E4E7EC] rounded-lg transition-colors flex items-center gap-3 group"
        >
          <div className="size-8 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#101828] group-hover:text-[#5B5FEF] transition-colors truncate">
              Activity Alerts
            </p>
            <p className="text-[11px] text-[#667085] truncate">Notifications & review</p>
          </div>
        </Link>
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
              <table className="w-full text-left text-sm min-w-[540px]">
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
