"use client";

import * as React from "react";
import { useState } from "react";
import { updateProjectMemberRoleAction } from "@/server/projects/member-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, Check, Loader2, ArrowUpCircle } from "lucide-react";
import { ProjectMemberRole } from "@prisma/client";

interface ChangeMemberRoleDialogProps {
  projectId: string;
  memberId: string;
  memberName: string;
  currentRole: string;
  trigger?: React.ReactNode;
}

const ROLES = [
  {
    role: "ACTING_LEAD",
    title: "Acting Project Lead",
    desc: "Empowered as acting team lead to coordinate tasks and sprint deliverables",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-300",
  },
  {
    role: "DEVELOPER",
    title: "Developer",
    desc: "Standard engineering execution, task completion, and PR reviews",
    badgeClass: "bg-blue-500/10 text-blue-700 border-blue-300",
  },
  {
    role: "DESIGNER",
    title: "UI/UX Designer",
    desc: "Product interface design, prototype validation, and design reviews",
    badgeClass: "bg-purple-500/10 text-purple-700 border-purple-300",
  },
  {
    role: "QA",
    title: "Quality Assurance",
    desc: "Acceptance testing, bug verification, and deployment certification",
    badgeClass: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
  },
];

export function ChangeMemberRoleDialog({
  projectId,
  memberId,
  memberName,
  currentRole,
  trigger,
}: ChangeMemberRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (selectedRole === currentRole) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("memberId", memberId);
      formData.set("newRole", selectedRole);

      await updateProjectMemberRoleAction(formData);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message || "Failed to update project role.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline inline-flex items-center gap-1"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Upgrade Role
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px] bg-white border border-[#E5E7EB] rounded-2xl shadow-clay p-5">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-clay-button">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-bold text-[#101828]">
                Change Project Role
              </DialogTitle>
              <DialogDescription className="text-[12px] text-text-muted">
                Assign project responsibility for {memberName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-[12px] text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2 mt-2">
          {ROLES.map(({ role, title, desc, badgeClass }) => {
            const isSelected = selectedRole === role;
            return (
              <div
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-[#F0FDF4] border-emerald-400/80 shadow-sm"
                    : "bg-surface-hover/40 border-border/70 hover:bg-surface-hover"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground">
                      {title}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}
                    >
                      {role.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-tight">
                    {desc}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-border bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="rounded-xl text-[12px] h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpdate}
            disabled={isLoading || selectedRole === currentRole}
            className="rounded-xl text-[12px] h-8 bg-[#101828] text-white hover:bg-black shadow-clay-button gap-1.5 font-medium px-4"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
