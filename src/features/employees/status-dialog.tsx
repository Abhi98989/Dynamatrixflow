"use client";

import * as React from "react";
import { useState } from "react";
import { updateEmployeeStatusAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AccountStatus } from "@prisma/client";
import { UserX, UserCheck, AlertTriangle, Loader2 } from "lucide-react";

interface StatusDialogProps {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    accountStatus: AccountStatus;
  };
  trigger?: React.ReactNode;
}

export function StatusDialog({ employee, trigger }: StatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AccountStatus>(employee.accountStatus);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateEmployeeStatusAction(employee.id, status);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            {employee.accountStatus === AccountStatus.ACTIVE ? (
              <UserX className="size-3.5 text-amber-600" />
            ) : (
              <UserCheck className="size-3.5 text-green-600" />
            )}
            Manage Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <AlertTriangle className="size-5 text-amber-600" />
            <DialogTitle className="text-lg font-bold">
              Update Account Status
            </DialogTitle>
          </div>
          <DialogDescription>
            Change the system access state for <strong>{employee.name}</strong>{" "}
            ({employee.employeeId}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Select Status
            </label>
            <div className="grid gap-2">
              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  status === AccountStatus.ACTIVE
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : "border-border hover:bg-surface-secondary/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    value={AccountStatus.ACTIVE}
                    checked={status === AccountStatus.ACTIVE}
                    onChange={() => setStatus(AccountStatus.ACTIVE)}
                    className="text-primary"
                  />
                  <div>
                    <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                      ACTIVE
                    </span>
                    <p className="text-xs text-text-muted">
                      Full access to assigned projects and tasks.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  status === AccountStatus.INACTIVE
                    ? "border-neutral-500 bg-neutral-50 dark:bg-neutral-900/40"
                    : "border-border hover:bg-surface-secondary/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    value={AccountStatus.INACTIVE}
                    checked={status === AccountStatus.INACTIVE}
                    onChange={() => setStatus(AccountStatus.INACTIVE)}
                    className="text-primary"
                  />
                  <div>
                    <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                      INACTIVE
                    </span>
                    <p className="text-xs text-text-muted">
                      Temporarily deactivated; cannot sign in.
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  status === AccountStatus.SUSPENDED
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                    : "border-border hover:bg-surface-secondary/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    value={AccountStatus.SUSPENDED}
                    checked={status === AccountStatus.SUSPENDED}
                    onChange={() => setStatus(AccountStatus.SUSPENDED)}
                    className="text-primary"
                  />
                  <div>
                    <span className="font-semibold text-sm text-red-700 dark:text-red-400">
                      SUSPENDED
                    </span>
                    <p className="text-xs text-text-muted">
                      Access revoked; all active sessions severed.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Status"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
