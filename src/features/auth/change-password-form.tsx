"use client";

import * as React from "react";
import { useActionState } from "react";
import { changePasswordAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Loader2, CheckCircle2 } from "lucide-react";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <p className="flex-1 leading-relaxed font-medium">{state.error}</p>
        </div>
      )}

      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">Security Requirement:</p>
        <ul className="list-disc pl-4 space-y-0.5 text-blue-700">
          <li>Minimum 8 characters in length</li>
          <li>Choose a strong, unique password not used elsewhere</li>
        </ul>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="newPassword"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="pl-9 h-10 rounded-md border-border bg-surface text-text-primary placeholder:text-text-disabled focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
            disabled={isPending}
          />
          <Lock className="absolute left-3 top-3 size-4 text-text-muted" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="confirmPassword"
          className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat new password"
            className="pl-9 h-10 rounded-md border-border bg-surface text-text-primary placeholder:text-text-disabled focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
            disabled={isPending}
          />
          <Lock className="absolute left-3 top-3 size-4 text-text-muted" />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-10 mt-2 font-semibold bg-[#5B5FEF] hover:bg-[#4C50D8] active:bg-[#4145C2] text-white rounded-md transition-colors"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            Set Password & Continue
          </>
        )}
      </Button>
    </form>
  );
}
