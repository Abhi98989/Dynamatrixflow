import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskStatusDropdown } from "@/features/tasks/task-status-dropdown";
import { SubtaskChecklist } from "@/features/tasks/subtask-checklist";
import { ReassignTaskDialog } from "@/features/tasks/reassign-task-dialog";
import { ReviewActionBanner } from "@/features/reviews/review-action-banner";
import { TaskCommentsSection } from "@/features/comments/task-comments-section";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  AlertCircle,
  History,
  Layers,
} from "lucide-react";
import { Priority, TaskStatus, SystemRole } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string; taskId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { title: true, taskCode: true },
  });

  if (!task) return { title: "Task Not Found | Dynamatrix Flow" };

  return {
    title: `${task.taskCode}: ${task.title} | Dynamatrix Flow`,
  };
}

export default async function TaskDetailPage({ params }: PageProps) {
  const currentUser = await requireActiveUser();
  const { id: projectId, taskId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) {
    notFound();
  }

  const task = await db.task.findUnique({
    where: { id: taskId, projectId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          projectLeadId: true,
          members: {
            where: { removedAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  employeeId: true,
                  position: true,
                },
              },
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          email: true,
          position: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
      milestone: {
        select: {
          id: true,
          name: true,
          milestoneCode: true,
        },
      },
      subtasks: {
        orderBy: { sortOrder: "asc" },
      },
      comments: {
        where: { deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      updates: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task) notFound();

  const isLeadOrAdmin =
    currentUser.systemRole === SystemRole.ADMIN ||
    task.project.projectLeadId === currentUser.id;
  const isAssignee = task.assigneeId === currentUser.id;
  const canEdit = isLeadOrAdmin || isAssignee;

  const isOverdue =
    task.dueDate &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.CANCELLED &&
    new Date(task.dueDate) < new Date();

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return (
          <span className="inline-flex items-center rounded-sm bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
            Critical Priority
          </span>
        );
      case Priority.HIGH:
        return (
          <span className="inline-flex items-center rounded-sm bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
            High Priority
          </span>
        );
      case Priority.MEDIUM:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary border border-border">
            Medium Priority
          </span>
        );
      case Priority.LOW:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2.5 py-1 text-xs font-normal text-text-muted border border-border">
            Low Priority
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/projects/${projectId}/tasks`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Project Tasks
        </Link>
      </div>

      {/* Overdue Banner */}
      {isOverdue && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 text-xs">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>
            <strong>Task is Overdue:</strong> Due date was{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString("en-US")
              : "past due"}
            . Immediate attention required.
          </span>
        </div>
      )}

      {/* Blocker Alert Banner */}
      {task.status === TaskStatus.BLOCKED && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold">
              This task is currently BLOCKED
            </h2>
            <p className="mt-1 text-xs text-red-800 dark:text-red-300 leading-relaxed">
              Reason:{" "}
              {task.blockerReason || "No specific blocker details recorded."}
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-secondary">
              {task.taskCode}
            </span>
            <Link
              href={`/projects/${projectId}`}
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              {task.project.name}
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {task.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <TaskStatusDropdown
              taskId={task.id}
              currentStatus={task.status}
              currentProgress={task.progress}
              blockerReason={task.blockerReason}
              isLeadOrAdmin={isLeadOrAdmin}
              isAssignee={isAssignee}
            />
            {getPriorityBadge(task.priority)}
            {task.milestone && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-purple-50 px-2 py-0.5 text-xs font-medium text-primary border border-purple-200">
                <Layers className="size-3" />[{task.milestone.milestoneCode}]{" "}
                {task.milestone.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review Workflow Banner */}
      <ReviewActionBanner
        taskId={task.id}
        taskCode={task.taskCode}
        status={task.status}
        submittedForReviewAt={task.submittedForReviewAt}
        completedAt={task.completedAt}
        isLeadOrAdmin={isLeadOrAdmin}
        isAssignee={isAssignee}
      />

      {/* Grid: Details, Checklist, Comments, History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description, Subtasks, Comments & History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                Description & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Subtask Checklist */}
          <Card>
            <CardContent className="pt-6">
              <SubtaskChecklist
                taskId={task.id}
                subtasks={task.subtasks}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          {/* Discussion & Comments */}
          <Card>
            <CardContent className="pt-6">
              <TaskCommentsSection
                taskId={task.id}
                comments={task.comments}
                currentUserId={currentUser.id}
                isLeadOrAdmin={isLeadOrAdmin}
              />
            </CardContent>
          </Card>

          {/* Task History Updates */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" /> Activity & History
                Log
              </CardTitle>
              <span className="text-xs text-text-muted">
                {task.updates.length} Events
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {task.updates.length === 0 ? (
                <p className="py-4 text-xs text-text-muted text-center">
                  No activity history recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {task.updates.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-lg border border-border bg-surface text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary">
                          {u.user.name} ({u.user.employeeId})
                        </span>
                        <span className="text-text-muted">
                          {new Date(u.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-text-secondary">{u.note}</p>
                      {u.blockerReason && (
                        <p className="text-red-600 font-medium">
                          Blocker reason: {u.blockerReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" /> Task Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Assignee</span>
                  {isLeadOrAdmin && (
                    <ReassignTaskDialog
                      taskId={task.id}
                      currentAssigneeId={task.assigneeId}
                      members={task.project.members}
                    />
                  )}
                </div>
                {task.assignee ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-xs">
                      {task.assignee.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">
                        {task.assignee.name}
                      </p>
                      <p className="text-text-muted text-[11px]">
                        {task.assignee.position || "Contributor"} ·{" "}
                        {task.assignee.employeeId}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 font-medium text-text-muted italic">
                    Unassigned
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border">
                <span className="text-text-muted">Created By</span>
                <p className="font-medium text-text-primary mt-0.5">
                  {task.createdBy.name} ({task.createdBy.employeeId})
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <Calendar className="size-3.5 text-text-muted" /> Start Date
                  </span>
                  <span className="font-medium text-text-primary">
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString("en-US")
                      : "Not set"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <Clock className="size-3.5 text-text-muted" /> Due Date
                  </span>
                  <span
                    className={`font-medium ${
                      isOverdue ? "text-red-600 font-bold" : "text-text-primary"
                    }`}
                  >
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US")
                      : "Not set"}
                  </span>
                </div>

                {task.estimatedMinutes && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Estimated Hours</span>
                    <span className="font-medium text-text-primary">
                      {(task.estimatedMinutes / 60).toFixed(1)} hrs
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
