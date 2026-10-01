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
  TrendingUp,
  Clock,
  AlertTriangle,
  Code2,
  Target,
  BarChart3,
  Calendar,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  GuestMonitorView,
  type GuestProjectData,
} from "@/features/guests/guest-monitor-view";

export const metadata: Metadata = { title: "Dashboard" };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", icon: <BarChart3 className="w-3 h-3" /> };
    case "PROJECT_LEAD":
      return { label: "Lead", icon: <Target className="w-3 h-3" /> };
    case "EMPLOYEE":
      return { label: "Developer", icon: <Code2 className="w-3 h-3" /> };
    default:
      return { label: role, icon: null };
  }
}

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
            id: true, taskCode: true, title: true, description: true,
            status: true, priority: true, progress: true, dueDate: true,
            completedAt: true, assignee: { select: { name: true, position: true } },
          },
          orderBy: { dueDate: "asc" },
        },
        milestones: {
          where: { archivedAt: null },
          select: { id: true, name: true, description: true, status: true, deadline: true, progressOverride: true },
          orderBy: { sortOrder: "asc" },
        },
        resources: {
          where: { archivedAt: null },
          select: { id: true, title: true, url: true, category: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedProjects: GuestProjectData[] = guestProjects.map((p) => ({
      id: p.id, name: p.name, projectCode: p.projectCode,
      description: p.description, status: p.status, priority: p.priority,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      deadline: p.deadline ? p.deadline.toISOString() : null,
      projectLead: p.projectLead,
      tasks: p.tasks.map((t) => ({ ...t, dueDate: t.dueDate ? t.dueDate.toISOString() : null, completedAt: t.completedAt ? t.completedAt.toISOString() : null })),
      milestones: p.milestones.map((m) => ({ ...m, deadline: m.deadline ? m.deadline.toISOString() : null })),
      resources: p.resources.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
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
  const isLead = currentUser.systemRole === SystemRole.PROJECT_LEAD;
  const isDev = currentUser.systemRole === SystemRole.EMPLOYEE;
  const roleBadge = getRoleBadge(currentUser.systemRole as string);

  let projectsQuery: Prisma.ProjectWhereInput = { status: { not: ProjectStatus.ARCHIVED } };
  if (!isAdmin) {
    projectsQuery = { ...projectsQuery, members: { some: { userId: currentUser.id, removedAt: null } } };
  }

  const projects = await db.project.findMany({
    where: projectsQuery,
    include: {
      projectLead: { select: { name: true } },
      tasks: { select: { id: true, status: true, priority: true, dueDate: true } },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const projectList = projects.map((p) => {
    let progress = 0;
    if (p.tasks.length > 0) {
      const completed = p.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      progress = Math.round((completed / p.tasks.length) * 100);
    }
    return {
      id: p.id, name: p.name,
      projectCode: p.projectCode || `PROJ-${p.id.substring(0, 3).toUpperCase()}`,
      status: p.status, progress, lead: p.projectLead?.name || "Unassigned",
      taskCount: p.tasks.length,
    };
  });

  const activeProjectsCount = (await db.project.count({ where: projectsQuery })) || 0;

  let tasksQuery: Prisma.TaskWhereInput = { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] } };
  if (!isAdmin) tasksQuery = { ...tasksQuery, assigneeId: currentUser.id };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = (await db.task.count({ where: { ...tasksQuery, dueDate: { lt: today } } })) || 0;
  const blockedCount = (await db.task.count({ where: { ...tasksQuery, status: TaskStatus.BLOCKED } })) || 0;
  const needsReviewCount = (await db.task.count({ where: { ...tasksQuery, status: TaskStatus.IN_REVIEW } })) || 0;

  const myTotalTasks = (await db.task.count({
    where: { assigneeId: currentUser.id, status: { notIn: [TaskStatus.CANCELLED] }, archivedAt: null },
  })) || 0;
  const myCompletedTasks = (await db.task.count({
    where: { assigneeId: currentUser.id, status: TaskStatus.COMPLETED, archivedAt: null },
  })) || 0;

  const upcomingDeadlines = await db.task.findMany({
    where: { ...tasksQuery, dueDate: { not: null, gte: today } },
    include: { project: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const allProjectsForHealth = await db.project.findMany({
    where: projectsQuery,
    select: {
      id: true, status: true,
      tasks: {
        where: { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }, dueDate: { lt: today } },
        select: { id: true },
      },
    },
  });

  const totalHealthProjects = allProjectsForHealth.length || 1;
  const completedProjectsCount = allProjectsForHealth.filter((p) => p.status === ProjectStatus.COMPLETED).length;
  const atRiskProjectsCount = allProjectsForHealth.filter((p) => p.status !== ProjectStatus.COMPLETED && p.tasks.length > 0).length;
  const onTrackProjectsCount = Math.max(0, allProjectsForHealth.length - completedProjectsCount - atRiskProjectsCount);

  const completedPct = Math.round((completedProjectsCount / totalHealthProjects) * 100);
  const atRiskPct = Math.round((atRiskProjectsCount / totalHealthProjects) * 100);
  const onTrackPct = Math.max(0, 100 - completedPct - atRiskPct);

  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeekCount = (await db.task.count({
    where: { status: TaskStatus.COMPLETED, completedAt: { gte: sevenDaysAgo }, ...(isAdmin ? {} : { assigneeId: currentUser.id }) },
  })) || 0;

  const myCompletionRate = myTotalTasks > 0 ? Math.round((myCompletedTasks / myTotalTasks) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {getGreeting()}, {currentUser.name?.split(" ")[0] || "there"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-border bg-surface text-[10px] font-semibold text-text-secondary shadow-sm">
              {roleBadge.icon}
              {roleBadge.label}
            </span>
          </div>
          <p className="text-text-muted mt-0.5 text-xs">
            {isAdmin ? "Organization overview." : isDev ? "Your tasks and deliverables." : "Team and project hub."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-foreground transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          {(isAdmin || isLead) && (
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-3">
        <div className="bg-surface rounded-lg p-2.5 sm:p-3 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {isDev ? "Open Tasks" : "Projects"}
            </span>
            {isDev ? <Code2 className="w-3.5 h-3.5 text-primary" /> : <FolderPlus className="w-3.5 h-3.5 text-primary" />}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none">
            {isDev ? myTotalTasks - myCompletedTasks : activeProjectsCount}
          </div>
          <span className="text-[10px] text-[#15803D] font-semibold mt-0.5 block">
            {isDev ? `${myCompletionRate}% done` : "Active"}
          </span>
        </div>

        <div className="bg-surface rounded-lg p-2.5 sm:p-3 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Overdue</span>
            {overdueCount > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> : <CheckSquare className="w-3.5 h-3.5 text-[#15803D]" />}
          </div>
          <div className={`text-xl sm:text-2xl font-bold tabular-nums leading-none ${overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>
            {overdueCount}
          </div>
          <span className={`text-[10px] font-semibold mt-0.5 block ${overdueCount > 0 ? "text-red-600" : "text-[#15803D]"}`}>
            {overdueCount > 0 ? "Needs attention" : "On schedule"}
          </span>
        </div>

        <div className="bg-surface rounded-lg p-2.5 sm:p-3 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Blocked</span>
            <Clock className={`w-3.5 h-3.5 ${blockedCount > 0 ? "text-[#D97706]" : "text-text-muted"}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-bold tabular-nums leading-none ${blockedCount > 0 ? "text-[#D97706]" : "text-foreground"}`}>
            {blockedCount}
          </div>
          <span className={`text-[10px] font-semibold mt-0.5 block ${blockedCount > 0 ? "text-[#D97706]" : "text-text-muted"}`}>
            {blockedCount > 0 ? "Stalled" : "Clear"}
          </span>
        </div>

        <div className="bg-surface rounded-lg p-2.5 sm:p-3 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {isDev ? "This Week" : "Review"}
            </span>
            {isDev ? <Zap className="w-3.5 h-3.5 text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none">
            {isDev ? completedThisWeekCount : needsReviewCount}
          </div>
          <span className="text-[10px] text-primary font-semibold mt-0.5 block">
            {isDev ? "Delivered" : "Queued"}
          </span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="bg-surface rounded-lg p-3 border border-border shadow-clay mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="size-3.5 text-primary" />
            <h2 className="text-xs font-bold text-foreground">
              {isDev ? "Delivery Momentum" : "Portfolio Health"}
            </h2>
            <span className="text-[10px] text-text-muted">· {allProjectsForHealth.length} projects</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.2 rounded">
            <TrendingUp className="size-3" />
            {completedThisWeekCount} this week
          </div>
        </div>

        <div className="h-2.5 w-full rounded-full flex overflow-hidden p-0.5 gap-0.5 bg-[#F1F4FA] shadow-clay-inset border border-border-subtle">
          {onTrackPct > 0 && (
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${onTrackPct}%` }} title={`On Track: ${onTrackPct}%`} />
          )}
          {atRiskPct > 0 && (
            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${atRiskPct}%` }} title={`At Risk: ${atRiskPct}%`} />
          )}
          {completedPct > 0 && (
            <div className="h-full bg-[#16A34A] rounded-full transition-all duration-500" style={{ width: `${completedPct}%` }} title={`Done: ${completedPct}%`} />
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[10px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" /><span className="text-text-muted">Track:</span><strong>{onTrackProjectsCount}</strong></span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-red-500" /><span className="text-text-muted">Risk:</span><strong className="text-red-600">{atRiskProjectsCount}</strong></span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-[#16A34A]" /><span className="text-text-muted">Done:</span><strong className="text-[#15803D]">{completedProjectsCount}</strong></span>
          </div>
          <Link href="/projects" className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5">
            All projects <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { href: isAdmin || isLead ? "/projects/new" : "/projects", icon: <FolderPlus className="size-3.5" />, label: isAdmin || isLead ? "New Project" : "Projects", sub: isAdmin || isLead ? "Create" : "Browse" },
          { href: "/my-tasks", icon: <CheckSquare className="size-3.5" />, label: "My Tasks", sub: isDev ? "Focus" : "Track" },
          { href: "/team", icon: <Users className="size-3.5" />, label: "Team", sub: "Directory", iconColor: "text-purple-600 bg-purple-500/10" },
          { href: "/notifications", icon: <Sparkles className="size-3.5" />, label: "Alerts", sub: "Updates", iconColor: "text-[#15803D] bg-[#F0FDF4]" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-2 bg-surface border border-border rounded-lg transition-colors flex items-center gap-2 group hover:border-primary/30"
          >
            <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${item.iconColor || "text-primary bg-primary/10"}`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-foreground group-hover:text-primary truncate">{item.label}</p>
              <p className="text-[9px] text-text-muted truncate">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Workstreams Table */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-xs">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-foreground text-xs">{isDev ? "My Projects" : "Active Workstreams"}</h2>
                <span className="text-[9px] font-bold text-text-muted bg-background px-1.5 py-0.2 rounded border border-border-subtle">{projectList.length}</span>
              </div>
              <Link href="/projects" className="text-[11px] font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] min-w-[480px]">
                <thead className="text-[10px] text-text-muted font-semibold border-b border-border uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Project</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">{isDev ? "Tasks" : "Lead"}</th>
                    <th className="py-2.5 px-4 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {projectList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-text-muted">
                        No active projects.
                      </td>
                    </tr>
                  ) : (
                    projectList.map((p) => (
                      <tr key={p.id} className="hover:bg-background transition-colors">
                        <td className="py-2.5 px-4">
                          <Link href={`/projects/${p.id}`} className="group">
                            <p className="font-semibold text-foreground text-[13px] group-hover:text-primary">{p.name}</p>
                            <p className="text-[10px] text-text-muted font-mono">{p.projectCode}</p>
                          </Link>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold ${
                            p.status === "COMPLETED" ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                              : p.status === "ON_HOLD" ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                                : p.status === "ACTIVE" ? "bg-primary/5 text-primary border-primary/20"
                                  : "bg-background text-text-secondary border-border"
                          }`}>
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-text-muted text-[12px]">
                          {isDev ? `${p.taskCount} tasks` : p.lead}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[#F1F4FA] shadow-clay-inset">
                              <div className={`h-full rounded-full ${p.progress === 100 ? "bg-[#16A34A]" : "bg-primary"}`} style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-text-muted tabular-nums w-6">{p.progress}%</span>
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

        {/* Deadlines */}
        <div>
          <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-xs h-full">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                <h2 className="font-bold text-foreground text-xs">Deadlines</h2>
              </div>
              <Link href="/upcoming" className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-0.5">
                All <ArrowRight className="size-3" />
              </Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="p-4 text-center">
                <Calendar className="w-5 h-5 text-text-muted mx-auto mb-1 opacity-50" />
                <p className="text-xs text-text-muted">No upcoming deadlines</p>
              </div>
            ) : (
              upcomingDeadlines.map((task, i) => {
                const daysUntil = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const isUrgent = daysUntil !== null && daysUntil <= 2;
                return (
                  <div key={task.id} className={`px-3 py-2 sm:py-2.5 ${i !== upcomingDeadlines.length - 1 ? "border-b border-border-subtle" : ""} hover:bg-background transition-colors`}>
                    <p className="font-semibold text-foreground text-xs leading-tight mb-1">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-text-muted truncate max-w-[140px]">{task.project.name}</p>
                      <span className={`text-[9px] font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded ${isUrgent ? "text-red-600 bg-red-50 border border-red-200" : "text-primary bg-primary/5 border border-primary/15"}`}>
                        <Clock className="w-2.5 h-2.5" />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
