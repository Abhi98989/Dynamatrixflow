import { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/features/projects/project-tabs";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
      priority: true,
      deadline: true,
      projectLead: { select: { id: true, name: true, position: true } },
      _count: { select: { tasks: true, milestones: true, members: true, resources: true } },
      tasks: { select: { status: true }, where: { archivedAt: null } },
    },
  });

  if (!project) notFound();

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === "COMPLETED").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatEnum = (val: string) =>
    val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const statusColor: Record<string, string> = {
    PLANNING: "bg-[#F2F4F7] text-[#667085]",
    ACTIVE: "bg-[#EFF6FF] text-[#2563EB]",
    IN_PROGRESS: "bg-[#EFF6FF] text-[#2563EB]",
    ON_HOLD: "bg-[#FFFBEB] text-[#B45309]",
    BLOCKED: "bg-[#FEF2F2] text-[#DC2626]",
    IN_REVIEW: "bg-[#F5F3FF] text-[#7C3AED]",
    COMPLETED: "bg-[#F0FDF4] text-[#15803D]",
    CANCELLED: "bg-[#F1F5F9] text-[#64748B]",
    ARCHIVED: "bg-[#F1F5F9] text-[#64748B]",
  };

  const priorityColor: Record<string, string> = {
    CRITICAL: "text-[#DC2626]",
    HIGH: "text-[#EA580C]",
    MEDIUM: "text-[#D97706]",
    LOW: "text-[#64748B]",
  };

  const isOverdue = project.deadline ? new Date(project.deadline) < new Date() : false;
  const deadlineText = project.deadline
    ? new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4">
        {/* Compact Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[#667085] mb-1">
              <Link href="/projects" className="hover:text-[#101828] transition-colors">Projects</Link>
              <span>›</span>
              <span className="font-mono text-[#98A2B3]">{project.projectCode}</span>
            </div>
            <h1 className="text-[22px] font-semibold text-[#101828] tracking-tight truncate">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${statusColor[project.status] || statusColor.PLANNING}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {formatEnum(project.status)}
              </span>
              <span className={`text-[11px] font-bold ${priorityColor[project.priority] || priorityColor.MEDIUM}`}>
                {formatEnum(project.priority)}
              </span>
              {project.projectLead && (
                <span className="text-[11px] text-[#667085]">Lead: <span className="font-semibold text-[#475467]">{project.projectLead.name}</span></span>
              )}
              {project.deadline && (
                <span className={`text-[11px] font-medium ${isOverdue ? 'text-[#DC2626]' : 'text-[#667085]'}`}>
                  Due {deadlineText}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-[5px] bg-[#EAECF0] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${progress === 100 ? 'bg-[#16A34A]' : 'bg-[#5B5FEF]'}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-[#475467] tabular-nums">{progress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ProjectTabs
          projectId={project.id}
          counts={{ tasks: project._count.tasks, milestones: project._count.milestones, members: project._count.members, resources: project._count.resources }}
          isGuest={(currentUser.systemRole as string) === "GUEST"}
        />

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
