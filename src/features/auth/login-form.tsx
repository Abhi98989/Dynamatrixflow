"use client";

import * as React from "react";
import { useActionState, useState } from "react";
import { loginAction } from "@/server/auth/actions";
import { AlertCircle, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[6px] border border-[#FDA29B] bg-[#FEF3F2] p-3 text-[13px] text-[#B42318]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#D92D20]" />
          <p className="flex-1 font-medium">{state.error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="employeeId"
          className="block text-[12px] font-semibold text-[#344054]"
        >
          Employee ID
        </label>
        <div className="relative">
          <input
            id="employeeId"
            name="employeeId"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. DMS-001"
            className="w-full pl-9 pr-3.5 h-10 rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] font-mono text-[13px] transition-colors"
            disabled={isPending}
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#98A2B3]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[12px] font-semibold text-[#344054]"
          >
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="w-full pl-9 pr-10 h-10 rounded-[6px] border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] font-mono text-[13px] transition-colors"
            disabled={isPending}
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#98A2B3]" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password visibility" : "Toggle visibility"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full h-10 mt-2 font-semibold bg-[#5B5FEF] hover:bg-[#4C50D8] active:bg-[#3E42C2] text-white rounded-[6px] transition-colors flex items-center justify-center gap-2 text-[13px] disabled:opacity-60 cursor-pointer"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In to Workspace</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <p className="text-[11px] text-[#667085] text-center pt-2">
        No public registration. Accounts are issued by Dynamatrix administration.
      </p>
    </form>
  );
}
