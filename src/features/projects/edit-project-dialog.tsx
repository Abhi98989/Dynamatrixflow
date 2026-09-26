"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { updateProjectAction, archiveProjectAction } from "./actions";
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
import { Edit3, AlertCircle, Loader2, Archive } from "lucide-react";
import { Priority, ProjectStatus } from "@prisma/client";

interface EditProjectDialogProps {
  project: {
    id: string;
    projectCode: string;
    name: string;
    description: string | null;
    clientName: string | null;
    status: ProjectStatus;
    priority: Priority;
    startDate: Date | null;
    deadline: Date | null;
    projectLeadId: string | null;
  };
  isAdmin: boolean;
  leads?: {
    id: string;
    name: string;
    employeeId: string;
  }[];
}

export function EditProjectDialog({
  project,
  isAdmin,
  leads = [],
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProjectAction(project.id, formData);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  const handleArchive = () => {
    if (
      !confirm(
        `Are you sure you want to archive project "${project.name}" [${project.projectCode}]?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await archiveProjectAction(project.id);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  const formatDateForInput = (d: Date | null) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold text-xs">
          <Edit3 className="mr-1.5 size-3.5" /> Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <Edit3 className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Edit Project Settings
            </DialogTitle>
          </div>
          <DialogDescription>
            Update project scope, timelines, status, and lead configuration.
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
            <Label htmlFor="edit-name">Project Name *</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={project.name}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-clientName">Client Name</Label>
            <Input
              id="edit-clientName"
              name="clientName"
              defaultValue={project.clientName || ""}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              name="description"
              defaultValue={project.description || ""}
              rows={3}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          {isAdmin && leads.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-lead">Project Lead</Label>
              <select
                id="edit-lead"
                name="projectLeadId"
                defaultValue={project.projectLeadId || ""}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                name="status"
                defaultValue={project.status}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={ProjectStatus.PLANNING}>Planning</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.ON_HOLD}>On Hold</option>
                <option value={ProjectStatus.COMPLETED}>Completed</option>
                <option value={ProjectStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-priority">Priority</Label>
              <select
                id="edit-priority"
                name="priority"
                defaultValue={project.priority}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.CRITICAL}>Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Input
                id="edit-startDate"
                name="startDate"
                type="date"
                defaultValue={formatDateForInput(project.startDate)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                name="deadline"
                type="date"
                defaultValue={formatDateForInput(project.deadline)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {isAdmin && project.status !== ProjectStatus.ARCHIVED ? (
              <Button
                type="button"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="mr-1.5 size-4" /> Archive Project
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
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
