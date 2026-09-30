"use client";

import { useState, useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGuestAction, type CreateGuestResult } from "./actions";
import { ShieldCheck, Copy, Check, Eye, EyeOff, Sparkles } from "lucide-react";

interface GenerateGuestDialogProps {
  projectId: string;
  projectName: string;
  projectCode: string;
  trigger?: React.ReactNode;
}

export function GenerateGuestDialog({
  projectId,
  projectName,
  projectCode,
  trigger,
}: GenerateGuestDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<
    CreateGuestResult,
    FormData
  >(createGuestAction, {});

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const copyFullInvite = () => {
    if (!state.guestCredentials) return;
    const creds = state.guestCredentials;
    const loginUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : "https://dynaflow.dynamatrixsolution.live/login";

    const message = `Hello ${creds.name},

Here are your credentials to access and monitor progress for "${creds.projectName}" on Dynamatrix Flow:

• Portal URL: ${loginUrl}
• Guest ID: ${creds.guestId}
• Email: ${creds.email}
• Password: ${creds.temporaryPassword}

You can log in using either your Guest ID (${creds.guestId}) or your Email. You will have real-time executive visibility into project milestones, active tasks, and upcoming delivery roadmaps.`;

    copyToClipboard(message, "Full Invite Summary");
  };

  const handleReset = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            className="bg-[#101828] hover:bg-[#1E293B] text-white text-xs font-semibold gap-2 border border-slate-700 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            Generate Guest Access
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md max-w-[95vw] p-5 sm:p-6 bg-surface border border-border rounded-xl shadow-lg">
        {!state.success || !state.guestCredentials ? (
          <>
            <DialogHeader className="space-y-1.5 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Generate Guest Credentials
                  </DialogTitle>
                  <DialogDescription className="text-xs text-text-muted">
                    Grant external guest / client access to monitor live
                    progress.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs text-text-secondary flex flex-col gap-1">
              <div className="flex justify-between items-center font-medium">
                <span className="text-[#64748B]">Monitoring Project:</span>
                <span className="font-semibold text-[#0F172A]">
                  {projectName} ({projectCode})
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0] mt-1">
                Guest accounts are granted <strong>Read-Only</strong>{" "}
                permissions to view % progress, in-progress tasks, and
                milestones. Internal team details and sensitive settings remain
                protected.
              </p>
            </div>

            <form action={formAction} className="space-y-4 pt-2">
              <input type="hidden" name="projectId" value={projectId} />

              <div className="space-y-1.5">
                <Label
                  htmlFor="guest-name"
                  className="text-xs font-semibold text-[#344054]"
                >
                  Guest Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guest-name"
                  name="name"
                  placeholder="e.g. John Doe (Stakeholder)"
                  required
                  className="h-9 text-xs border-border-subtle focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="guest-email"
                  className="text-xs font-semibold text-[#344054]"
                >
                  Guest Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guest-email"
                  name="email"
                  type="email"
                  placeholder="e.g. guest@clientcompany.com"
                  required
                  className="h-9 text-xs border-border-subtle focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="guest-password"
                    className="text-xs font-semibold text-[#344054]"
                  >
                    Custom Password{" "}
                    <span className="text-xs font-normal text-text-muted">
                      (Optional)
                    </span>
                  </Label>
                  <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto-generated if blank
                  </span>
                </div>
                <Input
                  id="guest-password"
                  name="password"
                  type="text"
                  placeholder="Leave empty for secure random password"
                  className="h-9 text-xs font-mono border-border-subtle focus-visible:ring-primary"
                />
              </div>

              {state.error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {state.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs h-9 text-text-secondary border-border-subtle"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs h-9 bg-primary hover:bg-primary-hover text-white font-semibold"
                >
                  {isPending ? "Generating..." : "Generate Credentials"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Guest Credentials Ready!
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Share these login details with your guest to monitor progress.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="bg-[#0B1020] text-white rounded-xl p-4 border border-[#1E293B] shadow-inner space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    GUEST MONITOR ACCESS
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E293B] text-[#38BDF8]">
                  {state.guestCredentials.projectCode}
                </span>
              </div>

              {/* Guest ID */}
              <div className="flex items-center justify-between bg-[#1E293B]/60 p-2.5 rounded-lg border border-[#334155]/40">
                <div>
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-medium">
                    Guest ID (Username)
                  </span>
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {state.guestCredentials.guestId}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(state.guestCredentials!.guestId, "Guest ID")
                  }
                  className="h-8 px-2.5 text-xs text-[#94A3B8] hover:text-white hover:bg-[#334155]"
                >
                  {copiedField === "Guest ID" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between bg-[#1E293B]/60 p-2.5 rounded-lg border border-[#334155]/40">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-medium">
                    Registered Email
                  </span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {state.guestCredentials.email}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(state.guestCredentials!.email, "Email")
                  }
                  className="h-8 px-2.5 text-xs text-[#94A3B8] hover:text-white hover:bg-[#334155] shrink-0"
                >
                  {copiedField === "Email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between bg-[#1E293B]/60 p-2.5 rounded-lg border border-[#334155]/40">
                <div>
                  <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-medium">
                    Password
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {showPassword
                        ? state.guestCredentials.temporaryPassword
                        : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#94A3B8] hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(
                      state.guestCredentials!.temporaryPassword,
                      "Password",
                    )
                  }
                  className="h-8 px-2.5 text-xs text-[#94A3B8] hover:text-white hover:bg-[#334155]"
                >
                  {copiedField === "Password" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                onClick={copyFullInvite}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs h-9 gap-2 shadow-sm"
              >
                {copiedField === "Full Invite Summary" ? (
                  <>
                    <Check className="w-4 h-4" /> Copied Full Invite!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Full Invite Card
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full text-xs h-9 text-text-secondary border-border-subtle"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
