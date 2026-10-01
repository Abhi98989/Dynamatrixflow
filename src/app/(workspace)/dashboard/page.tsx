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

/* ─── Helper: greeting based on time of day ─── */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Helper: role badge config ─── */
function getRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return { label: "Command Center", icon: <BarChart3 className="w-3 h-3" /> };
    case "PROJECT_LEAD":
      return { label: "Project Lead", icon: <Target className="w-3 h-3" /> };
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
  const isLead = currentUser.systemRole === SystemRole.PROJECT_LEAD;
  const isDev = currentUser.systemRole === SystemRole.EMPLOYEE;
  const roleBadge = getRoleBadge(currentUser.systemRole as string);

  let projectsQuery: Prisma.ProjectWhereInput = {
    status: { not: ProjectStatus.ARCHIVED },
  };
  if (!isAdmin) {
    projectsQuery = {
      ...projectsQuery,
      members: { some: { userId: currentUser.id, removedAt: null } },
    };
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
      const completed = p.tasks.filter(
        (t) => t.status === TaskStatus.COMPLETED,
      ).length;
      progress = Math.round((completed / p.tasks.length) * 100);
    }
    return {
      id: p.id,
      name: p.name,
      projectCode:
        p.projectCode || `PROJ-${p.id.substring(0, 3).toUpperCase()}`,
      status: p.status,
      progress,
      lead: p.projectLead?.name || "Unassigned",
      taskCount: p.tasks.length,
    };
  });

  const activeProjectsCount =
    (await db.project.count({ where: projectsQuery })) || 0;

  let tasksQuery: Prisma.TaskWhereInput = {
    status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
  };
  if (!isAdmin) tasksQuery = { ...tasksQuery, assigneeId: currentUser.id };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount =
    (await db.task.count({
      where: { ...tasksQuery, dueDate: { lt: today } },
    })) || 0;

  const blockedCount =
    (await db.task.count({
      where: { ...tasksQuery, status: TaskStatus.BLOCKED },
    })) || 0;
  const needsReviewCount =
    (await db.task.count({
      where: { ...tasksQuery, status: TaskStatus.IN_REVIEW },
    })) || 0;

  const myTotalTasks =
    (await db.task.count({
      where: {
        assigneeId: currentUser.id,
        status: { notIn: [TaskStatus.CANCELLED] },
        archivedAt: null,
      },
    })) || 0;

  const myCompletedTasks =
    (await db.task.count({
      where: {
        assigneeId: currentUser.id,
        status: TaskStatus.COMPLETED,
        archivedAt: null,
      },
    })) || 0;

  const upcomingDeadlines = await db.task.findMany({
    where: { ...tasksQuery, dueDate: { not: null, gte: today } },
    include: { project: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
    take: 5,
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
  const completedProjectsCount = allProjectsForHealth.filter(
    (p) => p.status === ProjectStatus.COMPLETED,
  ).length;
  const atRiskProjectsCount = allProjectsForHealth.filter(
    (p) => p.status !== ProjectStatus.COMPLETED && p.tasks.length > 0,
  ).length;
  const onTrackProjectsCount = Math.max(
    0,
    allProjectsForHealth.length - completedProjectsCount - atRiskProjectsCount,
  );

  const completedPct = Math.round(
    (completedProjectsCount / totalHealthProjects) * 100,
  );
  const atRiskPct = Math.round(
    (atRiskProjectsCount / totalHealthProjects) * 100,
  );
  const onTrackPct = Math.max(0, 100 - completedPct - atRiskPct);

  // Velocity computation (completed deliverables in the last 7 days)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeekCount =
    (await db.task.count({
      where: {
        status: TaskStatus.COMPLETED,
        completedAt: { gte: sevenDaysAgo },
        ...(isAdmin ? {} : { assigneeId: currentUser.id }),
      },
    })) || 0;

  const myCompletionRate = myTotalTasks > 0 ? Math.round((myCompletedTasks / myTotalTasks) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">
              {getGreeting()}, {currentUser.name?.split(" ")[0] || "there"}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[rgba(220,227,240,0.9)] bg-surface text-[11px] font-semibold text-text-secondary tracking-wide"
              style={{ boxShadow: "var(--shadow-clay)" }}
            >
              {roleBadge.icon}
              {roleBadge.label}
            </span>
          </div>
          <p className="text-text-secondary mt-1.5 text-[13px]">
            {isAdmin
              ? "Organization-wide command dashboard — everything at a glance."
              : isDev
                ? "Your personal workspace — tasks, deadlines, and delivery focus."
                : "Team and project management hub — track what matters."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-[rgba(220,227,240,0.9)] rounded-xl text-[13px] font-medium text-text-secondary hover:text-foreground transition-all"
            style={{ boxShadow: "var(--shadow-clay)" }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {(isAdmin || isLead) && (
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl text-[13px] font-semibold text-white hover:bg-primary-hover active:translate-y-[1px] transition-all"
              style={{
                boxShadow:
                  "4px 4px 12px rgba(30,58,138,0.3), -2px -2px 6px rgba(255,255,255,0.15)",
              }}
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* ─── KPI Cards (Clay Widgets) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {/* Card 1: Active Projects / My Tasks */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[140px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              {isDev ? "My Open Tasks" : "Active Projects"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {isDev ? (
                <Code2 className="w-4 h-4 text-primary" />
              ) : (
                <FolderPlus className="w-4 h-4 text-primary" />
              )}
            </div>
          </div>
          <div className="mt-auto">
            <div className="text-[34px] font-extrabold text-foreground tracking-tighter leading-none tabular-nums">
              {isDev ? myTotalTasks - myCompletedTasks : activeProjectsCount}
            </div>
            <div className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1.5">
              <span className="text-[#15803D] font-semibold">
                {isDev ? `${myCompletionRate}% done` : "In flight"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Overdue */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[140px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Overdue
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${overdueCount > 0 ? "bg-red-50" : "bg-[#F0FDF4]"}`}>
              {overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckSquare className="w-4 h-4 text-[#15803D]" />
              )}
            </div>
          </div>
          <div className="mt-auto">
            <div className={`text-[34px] font-extrabold tracking-tighter leading-none tabular-nums ${overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>
              {overdueCount}
            </div>
            <div className="text-[11px] text-text-muted mt-1.5">
              <span className={`font-semibold ${overdueCount > 0 ? "text-red-600" : "text-[#15803D]"}`}>
                {overdueCount > 0 ? "Needs attention" : "All on schedule"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Blocked */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[140px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Blocked
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${blockedCount > 0 ? "bg-amber-50" : "bg-background"}`}>
              <Clock className={`w-4 h-4 ${blockedCount > 0 ? "text-[#D97706]" : "text-text-muted"}`} />
            </div>
          </div>
          <div className="mt-auto">
            <div className={`text-[34px] font-extrabold tracking-tighter leading-none tabular-nums ${blockedCount > 0 ? "text-[#D97706]" : "text-foreground"}`}>
              {blockedCount}
            </div>
            <div className="text-[11px] text-text-muted mt-1.5">
              <span className={`font-semibold ${blockedCount > 0 ? "text-[#D97706]" : "text-text-muted"}`}>
                {blockedCount > 0 ? "Stalled items" : "Clear path"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Review / Velocity */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[140px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              {isDev ? "This Week" : "In Review"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              {isDev ? (
                <Zap className="w-4 h-4 text-primary" />
              ) : (
                <Sparkles className="w-4 h-4 text-primary" />
              )}
            </div>
          </div>
          <div className="mt-auto">
            <div className="text-[34px] font-extrabold text-foreground tracking-tighter leading-none tabular-nums">
              {isDev ? completedThisWeekCount : needsReviewCount}
            </div>
            <div className="text-[11px] text-text-muted mt-1.5">
              <span className="text-primary font-semibold">
                {isDev ? "Delivered this week" : "Queued for review"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Portfolio Health Bar (Clay) ─── */}
      <div
        className="bg-surface rounded-2xl p-6 border border-[rgba(220,227,240,0.9)] mb-7 space-y-4"
        style={{ boxShadow: "var(--shadow-clay)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <h2 className="text-[15px] font-bold text-foreground tracking-tight">
                {isDev ? "Personal Delivery Momentum" : "Portfolio Health & Velocity"}
              </h2>
            </div>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {isDev
                ? `Your completion rate and delivery stats across ${allProjectsForHealth.length} assigned projects.`
                : `Live status distribution across ${allProjectsForHealth.length} tracked workstreams.`}
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[12px] font-semibold self-start sm:self-auto"
            style={{ boxShadow: "var(--shadow-clay-inset)" }}
          >
            <TrendingUp className="size-3.5" />
            <span>
              {completedThisWeekCount} delivered this week
            </span>
          </div>
        </div>

        {/* Distribution Bar */}
        <div
          className="h-4 w-full rounded-full flex overflow-hidden p-0.5 gap-0.5 border border-[rgba(220,227,240,0.8)]"
          style={{ boxShadow: "var(--shadow-clay-inset)", background: "#F8FAFF" }}
        >
          {onTrackPct > 0 && (
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${onTrackPct}%` }}
              title={`On Track: ${onTrackProjectsCount} (${onTrackPct}%)`}
            />
          )}
          {atRiskPct > 0 && (
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${atRiskPct}%` }}
              title={`At Risk: ${atRiskProjectsCount} (${atRiskPct}%)`}
            />
          )}
          {completedPct > 0 && (
            <div
              className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
              style={{ width: `${completedPct}%` }}
              title={`Completed: ${completedProjectsCount} (${completedPct}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] pt-1">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              <span className="font-medium text-text-secondary">On Track:</span>
              <span className="font-bold text-foreground">{onTrackProjectsCount}</span>
              <span className="text-text-muted">({onTrackPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="font-medium text-text-secondary">At Risk:</span>
              <span className="font-bold text-red-600">{atRiskProjectsCount}</span>
              <span className="text-text-muted">({atRiskPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#16A34A]" />
              <span className="font-medium text-text-secondary">Completed:</span>
              <span className="font-bold text-[#15803D]">{completedProjectsCount}</span>
              <span className="text-text-muted">({completedPct}%)</span>
            </div>
          </div>

          <Link
            href="/projects"
            className="text-[12px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
          >
            View all projects
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ─── Quick Action Shortcuts ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        <Link
          href={isAdmin || isLead ? "/projects/new" : "/projects"}
          className="p-3.5 bg-surface hover:bg-[#FAFBFE] border border-[rgba(220,227,240,0.9)] rounded-xl transition-all flex items-center gap-3 group hover:shadow-clay"
        >
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <FolderPlus className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {isAdmin || isLead ? "New Project" : "All Projects"}
            </p>
            <p className="text-[11px] text-text-muted truncate">
              {isAdmin || isLead ? "Create workstream" : "Browse & explore"}
            </p>
          </div>
        </Link>

        <Link
          href="/my-tasks"
          className="p-3.5 bg-surface hover:bg-[#FAFBFE] border border-[rgba(220,227,240,0.9)] rounded-xl transition-all flex items-center gap-3 group hover:shadow-clay"
        >
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <CheckSquare className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
              My Tasks
            </p>
            <p className="text-[11px] text-text-muted truncate">
              {isDev ? "Focus & deliver" : "Track deliverables"}
            </p>
          </div>
        </Link>

        <Link
          href="/team"
          className="p-3.5 bg-surface hover:bg-[#FAFBFE] border border-[rgba(220,227,240,0.9)] rounded-xl transition-all flex items-center gap-3 group hover:shadow-clay"
        >
          <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
            <Users className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
              Team Directory
            </p>
            <p className="text-[11px] text-text-muted truncate">
              Roster & members
            </p>
          </div>
        </Link>

        <Link
          href="/notifications"
          className="p-3.5 bg-surface hover:bg-[#FAFBFE] border border-[rgba(220,227,240,0.9)] rounded-xl transition-all flex items-center gap-3 group hover:shadow-clay"
        >
          <div className="size-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]/50 flex items-center justify-center text-[#15803D] group-hover:scale-105 transition-transform">
            <Sparkles className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
              Notifications
            </p>
            <p className="text-[11px] text-text-muted truncate">
              Alerts & updates
            </p>
          </div>
        </Link>
      </div>

      {/* ─── Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) - Active Workstreams */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground text-[15px] tracking-tight">
                  {isDev ? "My Active Projects" : "Active Workstreams"}
                </h2>
                <span className="text-[10px] font-bold text-text-muted bg-background px-2 py-0.5 rounded-md border border-border-subtle">
                  {projectList.length}
                </span>
              </div>
              <Link
                href="/projects"
                className="text-[12px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[540px]">
                <thead className="text-[11px] text-text-secondary font-semibold border-b border-border uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Project</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">{isDev ? "Tasks" : "Lead"}</th>
                    <th className="py-3 px-6 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {projectList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-12 text-center text-[13px] text-text-secondary"
                      >
                        <div
                          className="w-12 h-12 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-3"
                          style={{ boxShadow: "var(--shadow-clay)" }}
                        >
                          <FolderPlus className="w-5 h-5 text-text-muted" />
                        </div>
                        No active projects found.
                      </td>
                    </tr>
                  ) : (
                    projectList.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-[#FAFBFE] transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <Link href={`/projects/${project.id}`} className="group">
                            <p className="font-semibold text-foreground text-[14px] group-hover:text-primary transition-colors">
                              {project.name}
                            </p>
                            <p className="text-[11px] text-text-muted font-mono mt-0.5">
                              {project.projectCode}
                            </p>
                          </Link>
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${
                              project.status === "COMPLETED"
                                ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                                : project.status === "ON_HOLD"
                                  ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                                  : project.status === "ACTIVE"
                                    ? "bg-primary/5 text-primary border-primary/20"
                                    : "bg-background text-text-secondary border-border"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-text-secondary text-[13px]">
                          {isDev ? (
                            <span className="font-medium">{project.taskCount} tasks</span>
                          ) : (
                            project.lead
                          )}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-20 h-2 rounded-full overflow-hidden border border-[rgba(220,227,240,0.6)]"
                              style={{
                                boxShadow: "var(--shadow-clay-inset)",
                                background: "#F8FAFF",
                              }}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  project.progress === 100
                                    ? "bg-[#16A34A]"
                                    : "bg-primary"
                                }`}
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-semibold text-text-secondary w-8 tabular-nums">
                              {project.progress}%
                            </span>
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

        {/* Right Column (1/3) - Upcoming Deadlines */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] overflow-hidden flex flex-col h-full shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <h2 className="font-bold text-foreground text-[15px] tracking-tight">
                  Upcoming Deadlines
                </h2>
              </div>
              <Link
                href="/upcoming"
                className="text-[12px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="flex-1">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div
                    className="w-12 h-12 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mb-3"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <Calendar className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    All clear
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    No upcoming deadlines
                  </p>
                </div>
              ) : (
                upcomingDeadlines.map((task, i) => {
                  const daysUntil = task.dueDate
                    ? Math.ceil(
                        (new Date(task.dueDate).getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;
                  const isUrgent = daysUntil !== null && daysUntil <= 2;

                  return (
                    <div
                      key={task.id}
                      className={`px-5 py-4 ${
                        i !== upcomingDeadlines.length - 1
                          ? "border-b border-border-subtle"
                          : ""
                      } hover:bg-[#FAFBFE] transition-colors`}
                    >
                      <p className="font-semibold text-foreground text-[14px] leading-tight mb-1.5">
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-text-muted">
                          {task.project.name}
                        </p>
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md ${
                            isUrgent
                              ? "text-red-600 bg-red-50 border border-red-200"
                              : "text-primary bg-primary/5 border border-primary/15"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )
                            : ""}
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
    </div>
  );
}
