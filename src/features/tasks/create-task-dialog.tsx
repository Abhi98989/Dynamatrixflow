'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { createTaskAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Priority, TaskStatus } from '@prisma/client';

interface CreateTaskDialogProps {
  projectId: string;
  members: {
    userId: string;
    user: {
      id: string;
      name: string;
      employeeId: string;
      position: string | null;
    };
  }[];
  milestones?: {
    id: string;
    name: string;
    milestoneCode: string;
  }[];
}

export function CreateTaskDialog({ projectId, members, milestones = [] }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('projectId', projectId);

    startTransition(async () => {
      const res = await createTaskAction(undefined, formData);
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
          <Plus className="mr-1.5 size-3.5" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <CheckSquare className="size-5" />
            <DialogTitle className="text-lg font-bold">Create Project Task</DialogTitle>
          </div>
          <DialogDescription>
            Define a deliverable, specify timelines, and assign active project contributors.
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
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              name="title"
              required
              placeholder="e.g. Implement Khalti payment callback handler"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description & Requirements</Label>
            <textarea
              id="task-description"
              name="description"
              rows={3}
              placeholder="Detailed acceptance criteria, endpoint definitions, or design references..."
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                name="assigneeId"
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.user.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-milestone">Milestone</Label>
              <select
                id="task-milestone"
                name="milestoneId"
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value="">None (General Backlog)</option>
                {milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    [{ms.milestoneCode}] {ms.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
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
              <Label htmlFor="task-status">Initial Status</Label>
              <select
                id="task-status"
                name="status"
                defaultValue={TaskStatus.TODO}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-startDate">Start Date</Label>
              <Input id="task-startDate" name="startDate" type="date" disabled={isPending} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-dueDate">Due Date</Label>
              <Input id="task-dueDate" name="dueDate" type="date" disabled={isPending} />
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
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
