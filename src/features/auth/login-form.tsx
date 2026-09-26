"use client";

import * as React from "react";
import { useActionState, useState } from "react";
import { loginAction } from "@/server/auth/actions";
import { AlertCircle, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <p className="flex-1 leading-relaxed font-medium">{state.error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="employeeId"
          className="text-[11px] font-bold uppercase tracking-wider text-[#475467]"
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
            className="w-full pl-10 pr-4 h-11 rounded-md border border-[#E4E7EC] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] font-mono text-[14px] transition-colors"
            disabled={isPending}
          />
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#667085]" />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-[11px] font-bold uppercase tracking-wider text-[#475467]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="w-full pl-10 pr-10 h-11 rounded-md border border-[#E4E7EC] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] font-mono tracking-widest text-[14px] transition-colors"
            disabled={isPending}
          />
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#667085]" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="relative w-full h-11 mt-4 font-semibold bg-[#4C50D8] hover:bg-[#4145C2] active:bg-[#393CBD] text-white rounded-md transition-colors flex items-center justify-center text-[15px]"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <ArrowRight className="absolute left-4 size-5 text-white/80" />
            Sign In to Workspace
          </>
        )}
      </button>

      <div className="pt-4 relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#EEF1F5]"></div>
        </div>
        <div className="relative bg-white px-3 text-[11px] text-[#667085] text-center max-w-[280px]">
          No public registration. Accounts are issued by Dynamatrix administration.
        </div>
      </div>
    </form>
  );
}
