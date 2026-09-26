"use client";

import * as React from "react";
import { useState, useActionState } from "react";
import { createEmployeeAction } from "./actions";
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
import {
  Plus,
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { SystemRole } from "@prisma/client";

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createEmployeeAction,
    undefined,
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 px-3.5 font-semibold bg-[#5B5FEF] hover:bg-[#4C50D8] text-white rounded-[6px]">
          <Plus className="mr-1.5 size-4" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <UserPlus className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Add New Employee
            </DialogTitle>
          </div>
          <DialogDescription>
            Create an internal employee profile. A unique Employee ID and secure
            temporary password will be automatically generated.
          </DialogDescription>
        </DialogHeader>

        {state?.success && state.temporaryCredentials ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Check className="size-4 text-green-600" /> Account Created
                Successfully
              </h3>
              <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                Share these temporary credentials securely with{" "}
                {state.temporaryCredentials.name}. They will be required to
                change this password upon their first login.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border bg-surface-secondary/60 p-4 text-sm font-mono">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-xs uppercase font-sans font-semibold">
                  Employee ID:
                </span>
                <span className="font-bold text-text-primary text-base">
                  {state.temporaryCredentials.employeeId}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-text-secondary text-xs uppercase font-sans font-semibold">
                  Temporary Password:
                </span>
                <span className="font-bold text-primary text-base">
                  {state.temporaryCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Important:</strong> This password is shown only once and
                cannot be retrieved again.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  handleCopy(
                    `Employee ID: ${state.temporaryCredentials?.employeeId}\nTemporary Password: ${state.temporaryCredentials?.temporaryPassword}`,
                  )
                }
              >
                {copied ? (
                  <Check className="mr-1.5 size-4 text-green-600" />
                ) : (
                  <Copy className="mr-1.5 size-4" />
                )}
                {copied ? "Copied Credentials" : "Copy Credentials"}
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-4 py-2">
            {state?.error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p className="flex-1 leading-relaxed">{state.error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Ramesh Karki"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">Position / Job Title *</Label>
              <Input
                id="position"
                name="position"
                required
                placeholder="e.g. Senior Backend Developer"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Company Email (Optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. ramesh@dynamatrix.internal"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="systemRole">System Role *</Label>
              <select
                id="systemRole"
                name="systemRole"
                defaultValue={SystemRole.EMPLOYEE}
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                disabled={isPending}
              >
                <option value={SystemRole.EMPLOYEE}>
                  Employee (Team Member)
                </option>
                <option value={SystemRole.PROJECT_LEAD}>Project Lead</option>
                <option value={SystemRole.ADMIN}>Company Leader / Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
