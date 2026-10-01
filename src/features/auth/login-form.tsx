"use client";

import * as React from "react";
import { useActionState, useState, useEffect } from "react";
import { loginAction } from "@/server/auth/actions";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  X,
  Sparkles,
} from "lucide-react";

interface ToastState {
  type: "error" | "success" | "info";
  title: string;
  message: string;
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);

  // Trigger floating toast whenever form action returns an error or success
  useEffect(() => {
    if (state?.error) {
      setToast({
        type: "error",
        title: "Authentication Failed",
        message: state.error,
      });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleAutofill = (id: string, pass: string, role: string) => {
    setEmployeeId(id);
    setPassword(pass);
    setToast({
      type: "info",
      title: "Credentials Loaded",
      message: `${role} credentials populated for ${id}.`,
    });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  };

  return (
    <>
      {/* Floating Compact Toast / Snackbar Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 flex items-start gap-2.5 rounded-lg bg-surface border border-border p-2.5 sm:p-3 shadow-md max-w-[340px] w-[calc(100vw-32px)] animate-in slide-in-from-top-2 fade-in duration-200 transition-all"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "error" && (
              <div className="size-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle className="size-3.5" />
              </div>
            )}
            {toast.type === "success" && (
              <div className="size-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-3.5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="size-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                <Sparkles className="size-3.5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-semibold text-foreground leading-tight">
              {toast.title}
            </h4>
            <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="size-5 rounded flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <div className="space-y-2">
          {/* Employee ID */}
          <div className="space-y-1">
            <label
              htmlFor="employeeId"
              className="block text-[10px] font-bold tracking-wider text-[#475569] uppercase"
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
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. DMS-001"
                className="w-full pl-9 pr-3.5 h-9.5 sm:h-10 rounded-[13px] border border-slate-200/50 bg-[#EEF2F8] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0724D0]/60 shadow-[inset_2.5px_3px_5px_rgba(160,175,200,0.45),inset_-2.5px_-3px_5px_rgba(255,255,255,0.95)] focus:shadow-[inset_3px_3.5px_6px_rgba(0,47,167,0.18),inset_-2.5px_-3px_5px_rgba(255,255,255,1),0_0_0_2px_rgba(0,47,167,0.25)] text-[12.5px] font-medium transition-all"
                disabled={isPending}
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#64748B]" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-[10px] font-bold tracking-wider text-[#475569] uppercase"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-9 h-9.5 sm:h-10 rounded-[13px] border border-slate-200/50 bg-[#EEF2F8] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0724D0]/60 shadow-[inset_2.5px_3px_5px_rgba(160,175,200,0.45),inset_-2.5px_-3px_5px_rgba(255,255,255,0.95)] focus:shadow-[inset_3px_3.5px_6px_rgba(0,47,167,0.18),inset_-2.5px_-3px_5px_rgba(255,255,255,1),0_0_0_2px_rgba(0,47,167,0.25)] text-[12.5px] font-medium transition-all"
                disabled={isPending}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#64748B]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Hide password visibility" : "Toggle visibility"
                }
              >
                {showPassword ? (
                  <EyeOff className="size-[14px]" />
                ) : (
                  <Eye className="size-[14px]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                className="peer sr-only"
                defaultChecked
              />
              <div className="w-3.5 h-3.5 rounded-[4px] border border-[#CBD5E1] bg-[#EEF2F8] peer-checked:bg-[#0724D0] peer-checked:border-[#0724D0] shadow-[inset_1px_1px_2px_rgba(160,175,200,0.3)] transition-all flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-[11.5px] font-medium text-[#475569]">Keep me signed in</span>
          </label>
          
          <a href="#" className="text-[11.5px] font-semibold text-[#0724D0] hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Main Submit Button */}
        <button
          type="submit"
          className="w-full h-10 sm:h-10.5 font-bold bg-gradient-to-r from-[#0034B8] via-[#002FA7] to-[#001F7A] hover:from-[#002688] hover:via-[#0030B8] hover:to-[#001860] active:scale-[0.985] text-white rounded-full shadow-[0_10px_22px_-3px_rgba(0,47,167,0.5),inset_0_2px_2.5px_rgba(255,255,255,0.48),inset_0_-2px_4px_rgba(0,18,80,0.35)] active:shadow-[inset_0_3px_6px_rgba(0,18,80,0.65)] transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-60 cursor-pointer"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="size-[14px]" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2.5 py-0.5">
          <div className="h-px bg-slate-200/70 flex-1" />
          <span className="text-[10px] font-medium text-[#94A3B8]">or</span>
          <div className="h-px bg-slate-200/70 flex-1" />
        </div>

        {/* SSO Button */}
        <button
          type="button"
          className="w-full h-9.5 sm:h-10 font-semibold bg-white hover:bg-slate-50/80 text-[#0B1220] rounded-full border border-slate-200/70 shadow-[2.5px_4px_10px_rgba(164,178,202,0.2),-2px_-2px_6px_rgba(255,255,255,1),inset_0_1px_1px_rgba(255,255,255,1)] active:scale-[0.985] active:shadow-[inset_1.5px_2px_3px_rgba(0,0,0,0.06)] transition-all flex items-center justify-center gap-2 text-[12px] cursor-pointer"
          disabled={isPending}
        >
          <Building2 className="size-[14px] text-[#0B1220]" />
          <span>Sign in with SSO</span>
        </button>

        {/* Interactive Demo Credentials Box */}
        <div className="rounded-[14px] bg-[#F4F7FC] border border-[#E2E8F0]/80 p-2.5 space-y-1.5 shadow-[inset_1px_1px_2px_rgba(160,175,200,0.1)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10.5px] font-bold text-[#0B1220] tracking-tight">Demo Credentials</h3>
            <span className="text-[9px] font-semibold text-primary uppercase tracking-wide">
              Click to autofill
            </span>
          </div>
          
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleAutofill("DMS-001", "DynamatrixDev123!", "Admin")}
              className="w-full flex items-center justify-between px-2 py-1 rounded-[8px] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all text-left group cursor-pointer"
            >
              <span className="text-[10.5px] text-[#64748B] group-hover:text-primary font-medium">Admin</span>
              <span className="font-mono text-[10.5px] font-semibold text-[#0B1220] group-hover:text-primary">DMS-001</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofill("DMS-003", "DynamatrixDev123!", "Employee")}
              className="w-full flex items-center justify-between px-2 py-1 rounded-[8px] hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all text-left group cursor-pointer"
            >
              <span className="text-[10.5px] text-[#64748B] group-hover:text-primary font-medium">Employee</span>
              <span className="font-mono text-[10.5px] font-semibold text-[#0B1220] group-hover:text-primary">DMS-003</span>
            </button>

            <div className="flex items-center justify-between px-2 py-0.5 text-[10px]">
              <span className="text-[#64748B]">Password</span>
              <span className="font-mono text-[10.5px] font-semibold text-[#0B1220]">DynamatrixDev123!</span>
            </div>
          </div>

          <div className="border-t border-[#E2E8F0]/80 pt-1">
            <p className="text-[8.5px] text-[#94A3B8] text-center leading-tight">
              Click either account to autofill credentials and sign in.
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
