"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { updateTaskStatusAction } from "./actions";
import { TaskStatus } from "@prisma/client";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface TaskStatusDropdownProps {
  taskId: string;
  currentStatus: TaskStatus;
  currentProgress?: number;
  blockerReason?: string | null;
  isLeadOrAdmin: boolean;
  isAssignee: boolean;
}

export function TaskStatusDropdown({
  taskId,
  currentStatus,
  currentProgress = 0,
  blockerReason: initialBlockerReason,
  isLeadOrAdmin,
  isAssignee,
}: TaskStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState(initialBlockerReason || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAvailableStatuses = (): TaskStatus[] => {
    if (isLeadOrAdmin) {
      return [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.BLOCKED,
        TaskStatus.IN_REVIEW,
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
      ];
    }
    if (isAssignee) {
      return [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.BLOCKED,
        TaskStatus.IN_REVIEW,
      ];
    }
    return [currentStatus];
  };

  const handleChange = (newStatus: TaskStatus) => {
    if (newStatus === currentStatus) return;
    setErrorMsg(null);

    if (newStatus === TaskStatus.BLOCKED) {
      setBlockerModalOpen(true);
      return;
    }

    startTransition(async () => {
      const res = await updateTaskStatusAction(
        taskId,
        newStatus,
        currentProgress,
      );
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const handleBlockerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setErrorMsg("Blocker reason is required.");
      return;
    }

    setBlockerModalOpen(false);
    startTransition(async () => {
      const res = await updateTaskStatusAction(
        taskId,
        TaskStatus.BLOCKED,
        currentProgress,
        reasonInput.trim(),
      );
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  const getStatusColor = (st: TaskStatus) => {
    switch (st) {
      case TaskStatus.TODO:
        return "bg-surface-secondary text-text-secondary border-border";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
      case TaskStatus.BLOCKED:
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300";
      case TaskStatus.IN_REVIEW:
        return "bg-purple-50 text-primary border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
      case TaskStatus.COMPLETED:
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300";
      case TaskStatus.CANCELLED:
        return "bg-neutral-100 text-neutral-500 border-neutral-300";
    }
  };

  const statuses = getAvailableStatuses();

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currentStatus}
        disabled={isPending || (!isLeadOrAdmin && !isAssignee)}
        onChange={(e) => handleChange(e.target.value as TaskStatus)}
        className={`h-7 rounded-sm border px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70 ${getStatusColor(
          currentStatus,
        )}`}
        aria-label="Update task status"
      >
        {statuses.map((st) => (
          <option key={st} value={st}>
            {st.replace("_", " ")}
          </option>
        ))}
      </select>

      {isPending && <Loader2 className="size-3 animate-spin text-text-muted" />}

      {errorMsg && (
        <span
          className="text-[11px] text-red-600 flex items-center gap-0.5"
          title={errorMsg}
        >
          <AlertCircle className="size-3 shrink-0" />
        </span>
      )}

      {/* Blocker Reason Modal */}
      <Dialog open={blockerModalOpen} onOpenChange={setBlockerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="size-5" /> Mark Task as Blocked
            </DialogTitle>
            <DialogDescription>
              Specify the blocker reason so project leads and team members can
              unblock this deliverable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBlockerSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="blockerReasonInput">Reason for Blocker *</Label>
              <textarea
                id="blockerReasonInput"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Awaiting client merchant API keys from finance team..."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Set Blocked
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
