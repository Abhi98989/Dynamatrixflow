import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/server/db/client';
import { requireActiveUser } from '@/server/auth/authorization';
import { Card } from '@/components/ui/card';
import { ReviewActionBanner } from '@/features/reviews/review-action-banner';
import {
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { TaskStatus, Priority, SystemRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Review Queue | Dynamatrix Flow',
  description: 'Project Lead verification pipeline for pending technical deliverables.',
};

export default async function ReviewQueuePage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  // Query: Find all deliverables currently IN_REVIEW that the user has authority to review or inspect
  const tasksInReview = await db.task.findMany({
    where: {
      status: TaskStatus.IN_REVIEW,
      archivedAt: null,
      project: {
        archivedAt: null,
        ...(isAdmin
          ? {}
          : {
              OR: [
                { projectLeadId: currentUser.id },
                { members: { some: { userId: currentUser.id, removedAt: null } } },
              ],
            }),
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectCode: true,
          projectLeadId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          position: true,
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
        select: {
          id: true,
          isCompleted: true,
        },
      },
      _count: {
        select: {
          comments: true,
          updates: true,
        },
      },
    },
    orderBy: {
      submittedForReviewAt: 'asc',
    },
  });

  // Calculate unique projects count
  const uniqueProjectIds = new Set(tasksInReview.map((t) => t.projectId));

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return (
          <span className="inline-flex items-center rounded-sm bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            Critical
          </span>
        );
      case Priority.HIGH:
        return (
          <span className="inline-flex items-center rounded-sm bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200">
            High
          </span>
        );
      case Priority.MEDIUM:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary border border-border">
            Medium
          </span>
        );
      case Priority.LOW:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2 py-0.5 text-xs font-normal text-text-muted border border-border">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-review-bg text-primary">
              <ClipboardCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                  Review Queue
                </h1>
                <span className="rounded-full bg-review-bg px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {tasksInReview.length} Pending
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Inspect, verify, approve, or request changes on completed deliverables.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Awaiting Decision</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {tasksInReview.length}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Deliverables submitted by contributors
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Projects Impacted</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {uniqueProjectIds.size}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Active workspaces with items in review
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-text-muted">Queue Status</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {tasksInReview.length === 0 ? (
              <>
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Clear</span>
              </>
            ) : (
              <>
                <span className="size-2.5 rounded-full bg-purple-600 animate-pulse" />
                <span className="text-sm font-bold text-primary">Reviews Required</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            {tasksInReview.length === 0
              ? 'No pending reviews across projects'
              : 'Prompt review ensures unblocked sprints'}
          </p>
        </Card>
      </div>

      {/* Review Queue Items */}
      {tasksInReview.length === 0 ? (
        <Card className="p-12 text-center bg-surface">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-text-primary">
            Review Queue is Clear
          </h3>
          <p className="mt-1 text-xs text-text-muted max-w-sm mx-auto">
            All submitted deliverables have been reviewed. Team members will appear here as soon as they submit deliverables for approval.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasksInReview.map((task) => {
            const isLeadOrAdmin =
              isAdmin || task.project.projectLeadId === currentUser.id;
            const isAssignee = task.assigneeId === currentUser.id;
            const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

            return (
              <Card key={task.id} className="p-5 border-purple-200/80 bg-surface shadow-xs">
                <div className="space-y-4">
                  {/* Top Row: Project & Code badges, Title & Details Link */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-secondary">
                        {task.project.projectCode}
                      </span>
                      <span className="text-xs text-text-muted font-medium">
                        {task.project.name}
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                        {task.taskCode}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.milestone && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-xs text-primary border border-purple-200">
                          <Layers className="size-3" />
                          [{task.milestone.milestoneCode}] {task.milestone.name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/projects/${task.projectId}/tasks/${task.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Inspect Full Task <ArrowRight className="size-3" />
                    </Link>
                  </div>

                  {/* Middle Row: Title, Description, Assignee & Subtasks summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <Link
                        href={`/projects/${task.projectId}/tasks/${task.id}`}
                        className="text-base font-bold text-text-primary hover:text-primary transition-colors"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {task.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs border-t md:border-t-0 md:border-l border-border md:pl-4">
                      <div>
                        <span className="text-text-muted">Submitted By</span>
                        {task.assignee ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-[10px]">
                              {task.assignee.name.charAt(0)}
                            </span>
                            <div>
                              <p className="font-semibold text-text-primary text-xs">
                                {task.assignee.name}
                              </p>
                              <p className="text-text-muted text-[11px]">
                                {task.assignee.position || 'Contributor'} · {task.assignee.employeeId}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-text-muted italic mt-0.5">Unassigned</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-text-muted pt-1">
                        <span>Checklist Steps</span>
                        <span className="font-medium text-text-primary">
                          {completedSubtasks} / {task.subtasks.length} done
                        </span>
                      </div>

                      {task.submittedForReviewAt && (
                        <div className="flex items-center justify-between text-text-muted">
                          <span>Submitted</span>
                          <span className="font-medium text-text-primary">
                            {new Date(task.submittedForReviewAt).toLocaleDateString("en-US", {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Review Decision Banner */}
                  <div className="pt-2">
                    <ReviewActionBanner
                      taskId={task.id}
                      taskCode={task.taskCode}
                      status={task.status}
                      submittedForReviewAt={task.submittedForReviewAt}
                      completedAt={task.completedAt}
                      isLeadOrAdmin={isLeadOrAdmin}
                      isAssignee={isAssignee}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
