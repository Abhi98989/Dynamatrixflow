"use client";

import * as React from "react";
import { useState } from "react";
import { resetEmployeePasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KeyRound, Copy, Check, ShieldAlert, Loader2 } from "lucide-react";

interface ResetPasswordDialogProps {
  employee: {
    id: string;
    employeeId: string;
    name: string;
  };
  trigger?: React.ReactNode;
}

export function ResetPasswordDialog({ employee, trigger }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await resetEmployeePasswordAction(employee.id);
      if (res.error) {
        setError(res.error);
      } else if (res.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
      }
    } catch (e) {
      setError((e as Error).message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setTempPassword(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <KeyRound className="size-3.5" />
            Reset Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary pb-1">
            <KeyRound className="size-5" />
            <DialogTitle className="text-lg font-bold">
              Reset Employee Password
            </DialogTitle>
          </div>
          <DialogDescription>
            Generate a new temporary password for{" "}
            <strong>{employee.name}</strong> ({employee.employeeId}).
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Check className="size-4 text-green-600" /> New Password
                Generated
              </h3>
              <p className="mt-1 text-xs text-green-700">
                Share this password with {employee.name}. They will be forced to
                change it on their next login.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border bg-surface-secondary/60 p-4 text-sm font-mono">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-xs uppercase font-sans font-semibold">
                  Employee ID:
                </span>
                <span className="font-bold text-text-primary text-base">
                  {employee.employeeId}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-text-secondary text-xs uppercase font-sans font-semibold">
                  New Password:
                </span>
                <span className="font-bold text-primary text-base">
                  {tempPassword}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Important:</strong> This temporary credential will not
                be shown again.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  handleCopy(
                    `Employee ID: ${employee.employeeId}\nTemporary Password: ${tempPassword}`,
                  )
                }
              >
                {copied ? (
                  <Check className="mr-1.5 size-4 text-green-600" />
                ) : (
                  <Copy className="mr-1.5 size-4" />
                )}
                {copied ? "Copied" : "Copy Password"}
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </p>
            )}
            <p className="text-sm text-text-secondary">
              This action invalidates their existing password immediately. Any
              active session will require re-authentication.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleReset} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Confirm & Generate Password"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
