"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "./actions";
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
import { Plus, FolderPlus, AlertCircle, Loader2 } from "lucide-react";
import { Priority, ProjectStatus } from "@prisma/client";

interface CreateProjectDialogProps {
  leads: {
    id: string;
    name: string;
    employeeId: string;
    position: string | null;
  }[];
}

export function CreateProjectDialog({ leads }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createProjectAction(undefined, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.projectId) {
        setOpen(false);
        router.push(`/projects/${res.projectId}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold text-xs sm:text-sm">
          <Plus className="mr-1.5 size-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <FolderPlus className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Create New Project
            </DialogTitle>
          </div>
          <DialogDescription>
            Initialize a scoped client or internal workspace with an assigned
            Project Lead.
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
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Expo Express Marketplace"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prefix">Code Prefix (2-5 letters)</Label>
              <Input
                id="prefix"
                name="prefix"
                placeholder="e.g. EXP (results in DF-EXP-001)"
                maxLength={5}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client / Organization</Label>
              <Input
                id="clientName"
                name="clientName"
                placeholder="e.g. Expo International"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Objective</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Brief summary of requirements, scope, and deliverables..."
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectLeadId">Project Lead *</Label>
            <select
              id="projectLeadId"
              name="projectLeadId"
              required
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            >
              <option value="">Select an active team member...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.employeeId}){" "}
                  {lead.position ? `— ${lead.position}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Initial Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={Priority.MEDIUM}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.CRITICAL}>Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Initial Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={ProjectStatus.PLANNING}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={ProjectStatus.PLANNING}>Planning</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.ON_HOLD}>On Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Target Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Target Deadline</Label>
              <Input
                id="deadline"
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
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
