"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { createMilestoneAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Layers, AlertCircle, Loader2 } from "lucide-react";
import { MilestoneStatus } from "@prisma/client";

interface CreateMilestoneDialogProps {
  projectId: string;
}

export function CreateMilestoneDialog({
  projectId,
}: CreateMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("projectId", projectId);

    startTransition(async () => {
      const res = await createMilestoneAction(undefined, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-semibold text-xs">
          <Plus className="mr-1.5 size-3.5" /> Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <Layers className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Create Milestone
            </DialogTitle>
          </div>
          <DialogDescription>
            Define key delivery phases and anchor critical deadlines for this
            project.
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
            <Label htmlFor="milestone-name">Milestone Name *</Label>
            <Input
              id="milestone-name"
              name="name"
              required
              placeholder="e.g. M1: Core Architecture & Auth Foundation"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-desc">Description</Label>
            <textarea
              id="milestone-desc"
              name="description"
              rows={2}
              placeholder="Key release outcomes and verification criteria..."
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-status">Status</Label>
            <select
              id="milestone-status"
              name="status"
              defaultValue={MilestoneStatus.PLANNED}
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
              <Label htmlFor="milestone-start">Start Date</Label>
              <Input
                id="milestone-start"
                name="startDate"
                type="date"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="milestone-deadline">Target Deadline</Label>
              <Input
                id="milestone-deadline"
                name="deadline"
                type="date"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Milestone"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
