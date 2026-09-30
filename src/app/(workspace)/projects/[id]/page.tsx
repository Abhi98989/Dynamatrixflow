import { db } from "@/server/db/client";
import {
  requireActiveUser,
  canManageProject,
} from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { AddMemberDialog } from "@/features/projects/add-member-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OverviewPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id } = await params;
  const now = new Date();

  const canManage = await canManageProject(currentUser.id, id);
  const availableUsers = canManage
    ? await db.user.findMany({
        where: {
          accountStatus: "ACTIVE",
          projectMemberships: { none: { projectId: id, removedAt: null } },
        },
        select: {
          id: true,
          name: true,
          employeeId: true,
          position: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      clientName: true,
      status: true,
      priority: true,
      deadline: true,
      startDate: true,
      technologyTags: true,
      projectLead: { select: { name: true, position: true } },
      _count: { select: { members: true } },
      tasks: {
        where: { archivedAt: null },
        select: { status: true, priority: true, dueDate: true },
      },
      milestones: {
        where: { archivedAt: null },
        select: { name: true, status: true, deadline: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!project) notFound();

  const t = project.tasks;
  const todo = t.filter((x) => x.status === "TODO").length;
  const inProgress = t.filter((x) => x.status === "IN_PROGRESS").length;
  const blocked = t.filter((x) => x.status === "BLOCKED").length;
  const inReview = t.filter((x) => x.status === "IN_REVIEW").length;
  const completed = t.filter((x) => x.status === "COMPLETED").length;
  const overdue = t.filter(
    (x) =>
      x.dueDate &&
      new Date(x.dueDate) < now &&
      x.status !== "COMPLETED" &&
      x.status !== "CANCELLED",
  ).length;

  const formatEnum = (val: string) =>
    val
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <h1 className="sr-only">{project.name}</h1>
      {/* Left column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Description */}
        {project.description && (
          <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
            <h3 className="text-[13px] font-semibold text-foreground mb-2">
              Description
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        )}

        {/* Task Breakdown */}
        <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">
            Task Breakdown
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "To Do", value: todo, color: "text-text-muted" },
              {
                label: "In Progress",
                value: inProgress,
                color: "text-[#2563EB]",
              },
              { label: "Blocked", value: blocked, color: "text-[#DC2626]" },
              { label: "In Review", value: inReview, color: "text-[#7C3AED]" },
              { label: "Completed", value: completed, color: "text-[#15803D]" },
              { label: "Overdue", value: overdue, color: "text-[#DC2626]" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        {project.milestones.length > 0 && (
          <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">
              Milestones
            </h3>
            <div className="space-y-2">
              {project.milestones.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${m.status === "COMPLETED" ? "bg-[#15803D]" : m.status === "IN_PROGRESS" ? "bg-[#2563EB]" : "bg-[#98A2B3]"}`}
                    />
                    <span className="text-[13px] font-medium text-foreground">
                      {m.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-text-muted">
                      {formatEnum(m.status)}
                    </span>
                    {m.deadline && (
                      <span className="text-[11px] text-text-muted">
                        {new Date(m.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-4">
        {/* Team Section */}
        <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-foreground">
              Project Team ({project._count.members})
            </h3>
            {canManage && (
              <AddMemberDialog
                projectId={project.id}
                availableUsers={availableUsers}
              />
            )}
          </div>
          <p className="text-[12px] text-text-muted">
            {project._count.members} active contributor
            {project._count.members === 1 ? "" : "s"}
          </p>
        </div>

        {/* Details */}
        <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">
            Details
          </h3>
          <dl className="space-y-2.5 text-[13px]">
            {project.clientName && (
              <Row label="Client" value={project.clientName} />
            )}
            <Row
              label="Lead"
              value={project.projectLead?.name || "Unassigned"}
            />
            <Row label="Team" value={`${project._count.members} members`} />
            {project.startDate && (
              <Row
                label="Started"
                value={new Date(project.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            )}
            {project.deadline && (
              <Row
                label="Deadline"
                value={new Date(project.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
            )}
          </dl>
        </div>

        {/* Tags */}
        {project.technologyTags.length > 0 && (
          <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-5 shadow-clay">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">
              Technology
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologyTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-surface-hover text-[11px] font-medium text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
