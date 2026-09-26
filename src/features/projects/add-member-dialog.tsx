"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { addProjectMemberAction } from "./actions";
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
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { ProjectMemberRole } from "@prisma/client";

interface AddMemberDialogProps {
  projectId: string;
  availableUsers: {
    id: string;
    name: string;
    employeeId: string;
    position: string | null;
  }[];
}

export function AddMemberDialog({
  projectId,
  availableUsers,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState<ProjectMemberRole>(
    ProjectMemberRole.DEVELOPER,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("Please select an employee.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await addProjectMemberAction(projectId, selectedUser, role);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setSelectedUser("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-semibold text-xs">
          <UserPlus className="mr-1.5 size-3.5" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <UserPlus className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Add Project Member
            </DialogTitle>
          </div>
          <DialogDescription>
            Grant workspace access and assign a functional role on this project.
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
            <Label htmlFor="memberSelect">Select Employee *</Label>
            <select
              id="memberSelect"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            >
              <option value="">Choose an employee...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.employeeId}){" "}
                  {u.position ? `· ${u.position}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roleSelect">Project Role *</Label>
            <select
              id="roleSelect"
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              disabled={isPending}
            >
              <option value={ProjectMemberRole.DEVELOPER}>Developer</option>
              <option value={ProjectMemberRole.DESIGNER}>Designer</option>
              <option value={ProjectMemberRole.QA}>QA Specialist</option>
              <option value={ProjectMemberRole.RESEARCHER}>Researcher</option>
              <option value={ProjectMemberRole.PROJECT_LEAD}>
                Project Lead / Co-Lead
              </option>
              <option value={ProjectMemberRole.OTHER}>Other Contributor</option>
            </select>
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
                  <Loader2 className="mr-2 size-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
