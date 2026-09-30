"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { reassignTaskAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCheck, AlertCircle, Loader2 } from "lucide-react";

interface ReassignTaskDialogProps {
  taskId: string;
  currentAssigneeId?: string | null;
  members: {
    userId: string;
    user: {
      id: string;
      name: string;
      employeeId: string;
      position: string | null;
    };
  }[];
}

export function ReassignTaskDialog({
  taskId,
  currentAssigneeId,
  members,
}: ReassignTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(currentAssigneeId || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || selectedUser === currentAssigneeId) {
      setOpen(false);
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await reassignTaskAction(taskId, selectedUser);
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
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs text-primary hover:underline"
        >
          Reassign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <UserCheck className="size-5" />
            <DialogTitle className="text-base font-bold">
              Reassign Task
            </DialogTitle>
          </div>
          <DialogDescription>
            Select a project contributor to take ownership of this deliverable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReassign} className="space-y-4 py-2">
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
            <Label htmlFor="reassign-select">New Assignee *</Label>
            <select
              id="reassign-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isPending}
            >
              <option value="">Select project member...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} ({m.user.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !selectedUser || selectedUser === currentAssigneeId
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />{" "}
                  Reassigning...
                </>
              ) : (
                "Confirm Reassignment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
