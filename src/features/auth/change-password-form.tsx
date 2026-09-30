"use client";

import * as React from "react";
import { useActionState, useState, useEffect } from "react";
import { changePasswordAction } from "@/server/auth/actions";
import { Lock, Loader2, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";

interface ToastState {
  type: "error" | "success" | "info";
  title: string;
  message: string;
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    undefined,
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (state?.error) {
      setToast({
        type: "error",
        title: "Update Failed",
        message: state.error,
      });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <>
      {/* Floating Claymorphic Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 sm:top-6 sm:right-6 z-50 flex items-start gap-3 rounded-[20px] bg-white/95 backdrop-blur-md border border-white p-3.5 sm:p-4 shadow-[16px_20px_45px_rgba(15,23,42,0.18),-8px_-8px_24px_rgba(255,255,255,1),inset_0_2px_3px_rgba(255,255,255,0.95)] max-w-[380px] w-[calc(100vw-40px)] animate-in slide-in-from-top-4 fade-in duration-300 transition-all"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "error" && (
              <div className="size-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]">
                <AlertCircle className="size-4.5" />
              </div>
            )}
            {toast.type === "success" && (
              <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]">
                <CheckCircle2 className="size-4.5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="size-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0724D0] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.06)]">
                <Sparkles className="size-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-[12.5px] font-bold text-[#0B1220] leading-tight">
              {toast.title}
            </h4>
            <p className="text-[11.5px] text-[#475569] mt-0.5 leading-snug">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="size-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Requirement banner */}
        <div className="rounded-[14px] bg-[#EEF2F8] border border-white p-3 text-[11px] text-[#475569] shadow-[inset_1.5px_2px_4px_rgba(160,175,200,0.25),inset_-1.5px_-2px_4px_rgba(255,255,255,0.9)]">
          <p className="font-bold text-[#0B1220] mb-0.5">Password Policy</p>
          <ul className="list-disc pl-3.5 space-y-0.5 text-[#64748B]">
            <li>Minimum 8 characters in length</li>
            <li>Choose a unique password for company security</li>
          </ul>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="newPassword"
            className="block text-[10px] font-bold tracking-wider text-[#475569] uppercase"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full pl-9 pr-3.5 h-10 rounded-[13px] border border-slate-200/50 bg-[#EEF2F8] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0724D0]/60 shadow-[inset_2.5px_3px_5px_rgba(160,175,200,0.45),inset_-2.5px_-3px_5px_rgba(255,255,255,0.95)] focus:shadow-[inset_3px_3.5px_6px_rgba(0,47,167,0.18),inset_-2.5px_-3px_5px_rgba(255,255,255,1),0_0_0_2px_rgba(0,47,167,0.25)] text-[12.5px] font-medium transition-all"
              disabled={isPending}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#64748B]" />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="block text-[10px] font-bold tracking-wider text-[#475569] uppercase"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Repeat new password"
              className="w-full pl-9 pr-3.5 h-10 rounded-[13px] border border-slate-200/50 bg-[#EEF2F8] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0724D0]/60 shadow-[inset_2.5px_3px_5px_rgba(160,175,200,0.45),inset_-2.5px_-3px_5px_rgba(255,255,255,0.95)] focus:shadow-[inset_3px_3.5px_6px_rgba(0,47,167,0.18),inset_-2.5px_-3px_5px_rgba(255,255,255,1),0_0_0_2px_rgba(0,47,167,0.25)] text-[12.5px] font-medium transition-all"
              disabled={isPending}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#64748B]" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-10.5 mt-2 font-bold bg-gradient-to-r from-[#0034B8] via-[#002FA7] to-[#001F7A] hover:from-[#002688] hover:via-[#0030B8] hover:to-[#001860] active:scale-[0.985] text-white rounded-full shadow-[0_10px_22px_-3px_rgba(0,47,167,0.5),inset_0_2px_2.5px_rgba(255,255,255,0.48),inset_0_-2px_4px_rgba(0,18,80,0.35)] active:shadow-[inset_0_3px_6px_rgba(0,18,80,0.65)] transition-all flex items-center justify-center gap-2 text-[13px] disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              <span>Set Password & Enter Workspace</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
