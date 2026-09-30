"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { updateMilestoneAction, archiveMilestoneAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { MilestoneStatus } from "@prisma/client";

interface EditMilestoneDialogProps {
  milestone: {
    id: string;
    milestoneCode: string;
    name: string;
    description: string | null;
    status: MilestoneStatus;
    startDate: Date | null;
    deadline: Date | null;
    progressOverride: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMilestoneDialog({
  milestone,
  open,
  onOpenChange,
}: EditMilestoneDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("id", milestone.id);

    startTransition(async () => {
      const res = await updateMilestoneAction(undefined, formData);
      if (res.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  const handleArchive = () => {
    if (
      !window.confirm(
        `Are you sure you want to archive milestone ${milestone.milestoneCode}?`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await archiveMilestoneAction(milestone.id);
      if (res.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  const formatDateForInput = (d: Date | null) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <Settings2 className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Edit Milestone [{milestone.milestoneCode}]
            </DialogTitle>
          </div>
          <DialogDescription>
            Update dates, delivery status, or archive this milestone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <p className="flex-1 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-milestone-name">Milestone Name *</Label>
            <Input
              id="edit-milestone-name"
              name="name"
              defaultValue={milestone.name}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-milestone-desc">Description</Label>
            <textarea
              id="edit-milestone-desc"
              name="description"
              defaultValue={milestone.description || ""}
              rows={2}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-milestone-status">Status</Label>
            <select
              id="edit-milestone-status"
              name="status"
              defaultValue={milestone.status}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            >
              <option value={MilestoneStatus.PLANNED}>Planned</option>
              <option value={MilestoneStatus.IN_PROGRESS}>In Progress</option>
              <option value={MilestoneStatus.ON_HOLD}>On Hold</option>
              <option value={MilestoneStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-milestone-start">Start Date</Label>
              <Input
                id="edit-milestone-start"
                name="startDate"
                type="date"
                defaultValue={formatDateForInput(milestone.startDate)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-milestone-deadline">Target Deadline</Label>
              <Input
                id="edit-milestone-deadline"
                name="deadline"
                type="date"
                defaultValue={formatDateForInput(milestone.deadline)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleArchive}
              disabled={isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="size-3.5 mr-1" /> Archive
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
