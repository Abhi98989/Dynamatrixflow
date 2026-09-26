'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import {
  submitForReviewAction,
  approveTaskReviewAction,
  requestChangesAction,
  reopenTaskAction,
} from './actions';
import { TaskStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Send,
  AlertCircle,
  Loader2,
  FileQuestion,
} from 'lucide-react';

interface ReviewActionBannerProps {
  taskId: string;
  taskCode: string;
  status: TaskStatus;
  submittedForReviewAt?: Date | null;
  completedAt?: Date | null;
  isLeadOrAdmin: boolean;
  isAssignee: boolean;
}

export function ReviewActionBanner({
  taskId,
  taskCode,
  status,
  submittedForReviewAt,
  completedAt,
  isLeadOrAdmin,
  isAssignee,
}: ReviewActionBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitNote, setSubmitNote] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');

  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesFeedback, setChangesFeedback] = useState('');

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitForReviewAction(taskId, submitNote);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSubmitModalOpen(false);
        setSubmitNote('');
      }
    });
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await approveTaskReviewAction(taskId, approveNote);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setApproveModalOpen(false);
        setApproveNote('');
      }
    });
  };

  const handleRequestChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!changesFeedback.trim()) {
      setErrorMsg('Please specify what changes are required before submitting.');
      return;
    }

    startTransition(async () => {
      const res = await requestChangesAction(taskId, changesFeedback);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setChangesModalOpen(false);
        setChangesFeedback('');
      }
    });
  };

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!reopenReason.trim() || reopenReason.trim().length < 5) {
      setErrorMsg('A clear audit reason of at least 5 characters is required to reopen this task.');
      return;
    }

    startTransition(async () => {
      const res = await reopenTaskAction(taskId, reopenReason);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setReopenModalOpen(false);
        setReopenReason('');
      }
    });
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <p className="flex-1 font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Case 1: Task is Pending Review (IN_REVIEW) */}
      {status === TaskStatus.IN_REVIEW && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Deliverable Submitted for Review
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {submittedForReviewAt
                  ? `Submitted on ${new Date(submittedForReviewAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : 'Awaiting review decision from Project Lead.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isLeadOrAdmin ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setChangesModalOpen(true)}
                  disabled={isPending}
                  className="h-8 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                >
                  <FileQuestion className="mr-1.5 size-3.5" /> Request Changes
                </Button>
                <Button
                  size="sm"
                  onClick={() => setApproveModalOpen(true)}
                  disabled={isPending}
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="mr-1.5 size-3.5" /> Approve Deliverable
                </Button>
              </>
            ) : (
              <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-md bg-primary/10">
                Pending Lead Approval
              </span>
            )}
          </div>
        </div>
      )}

      {/* Case 2: Task is Completed -> Allow Reopen if Lead/Admin */}
      {status === TaskStatus.COMPLETED && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                Deliverable Completed & Approved
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {completedAt
                  ? `Verified and completed on ${new Date(completedAt).toLocaleDateString("en-US", {
                      dateStyle: 'medium',
                    })}`
                  : 'All acceptance criteria satisfied.'}
              </p>
            </div>
          </div>

          {isLeadOrAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReopenModalOpen(true)}
              disabled={isPending}
              className="h-8 text-xs font-semibold text-text-secondary hover:text-red-700 hover:border-red-200"
            >
              <RotateCcw className="mr-1.5 size-3.5" /> Reopen Deliverable
            </Button>
          )}
        </div>
      )}

      {/* Case 3: Task is In Progress -> Allow Submit for Review */}
      {(status === TaskStatus.IN_PROGRESS || status === TaskStatus.TODO) && (isAssignee || isLeadOrAdmin) && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3.5">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            <p className="text-xs text-text-secondary">
              Finished implementation? Submit this deliverable for Project Lead review.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setSubmitModalOpen(true)}
            disabled={isPending}
            className="h-8 text-xs font-semibold shrink-0"
          >
            Submit for Review
          </Button>
        </div>
      )}

      {/* Modal: Submit for Review */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Send className="size-4 text-primary" /> Submit {taskCode} for Review
            </DialogTitle>
            <DialogDescription>
              Your deliverable will be moved to In Review and your Project Lead will be notified.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="submitNotesInput">Summary Note / PR / Demo Link (Optional)</Label>
              <textarea
                id="submitNotesInput"
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                rows={3}
                placeholder="e.g. PR #42 merged, documentation updated in resources tab..."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Confirm Submission
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Approve Review */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" /> Approve {taskCode}
            </DialogTitle>
            <DialogDescription>
              Mark this deliverable as completed and record formal verification in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApprove} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="approveNotesInput">Approval Comments / Praise (Optional)</Label>
              <textarea
                id="approveNotesInput"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={3}
                placeholder="e.g. Verified responsive layout across viewports and approved PR."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Approve & Complete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Request Changes */}
      <Dialog open={changesModalOpen} onOpenChange={setChangesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-800 flex items-center gap-2">
              <FileQuestion className="size-5 text-amber-600" /> Request Changes on {taskCode}
            </DialogTitle>
            <DialogDescription>
              Move deliverable back to In Progress and specify what modifications are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestChanges} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="feedbackInput">Required Changes & Feedback *</Label>
              <textarea
                id="feedbackInput"
                value={changesFeedback}
                onChange={(e) => setChangesFeedback(e.target.value)}
                required
                rows={4}
                placeholder="Specify exact edge cases or criteria that need revision..."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setChangesModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Send Feedback & Return
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Reopen Completed Task */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-800 flex items-center gap-2">
              <RotateCcw className="size-5 text-red-600" /> Reopen Completed Deliverable
            </DialogTitle>
            <DialogDescription>
              Reopening a completed deliverable requires a clear audit reason recorded in project history.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReopen} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reopenReasonInput">Reason for Reopening *</Label>
              <textarea
                id="reopenReasonInput"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Client requested revisions to payment webhook response format."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setReopenModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                variant="destructive"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Reopen Deliverable
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
