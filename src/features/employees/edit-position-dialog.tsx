"use client";

import * as React from "react";
import { useState } from "react";
import { updateEmployeePositionAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Briefcase, Check, Loader2, Sparkles, UserCheck } from "lucide-react";
import { SystemRole } from "@prisma/client";

interface EditPositionDialogProps {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    position?: string | null;
    systemRole?: SystemRole;
  };
  isAdmin?: boolean;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const PRESET_POSITIONS = [
  "Fullstack Developer",
  "System Designer",
  "Backend Developer",
  "Frontend Developer",
  "DevOps Engineer",
  "Solutions Architect",
  "Mobile Developer",
  "QA Engineer",
  "Lead Software Engineer",
];

export function EditPositionDialog({
  employee,
  isAdmin = false,
  trigger,
  onSuccess,
}: EditPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(employee.position || "");
  const [promoteToLead, setPromoteToLead] = useState(
    employee.systemRole === SystemRole.PROJECT_LEAD,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) {
      setError("Position cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const targetSystemRole = isAdmin
        ? promoteToLead
          ? SystemRole.PROJECT_LEAD
          : employee.systemRole === SystemRole.PROJECT_LEAD
            ? SystemRole.EMPLOYEE
            : undefined
        : undefined;

      const res = await updateEmployeePositionAction(
        employee.id,
        position.trim(),
        targetSystemRole,
      );

      if (!res.success) {
        setError(res.error || "Failed to update position.");
      } else {
        setSuccessMsg("Position updated successfully!");
        onSuccess?.();
        setTimeout(() => {
          setOpen(false);
          setSuccessMsg(null);
        }, 900);
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] font-medium border-border/80 text-foreground hover:bg-surface-hover rounded-lg shadow-sm gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            Upgrade Role
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px] bg-white border border-[#E5E7EB] rounded-2xl shadow-clay p-5">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-clay-button">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-[#101828]">
                Upgrade Position & Role
              </DialogTitle>
              <DialogDescription className="text-[12px] text-text-muted">
                {employee.name} ({employee.employeeId})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-[12px] text-red-600 font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[12px] text-emerald-600 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-text-secondary">
              Position / Designation
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Fullstack Developer, System Designer"
              className="w-full h-9 px-3 text-[13px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-clay-inset transition-all"
              required
            />
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_POSITIONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPosition(preset)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                    position === preset
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-[#F1F5F9] text-[#334155] border-transparent hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Admin Lead Toggle */}
          {isAdmin && (
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoteToLead}
                  onChange={(e) => setPromoteToLead(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/30 border-border"
                />
                <div className="text-[12px]">
                  <span className="font-semibold text-foreground">
                    Project Lead System Privilege
                  </span>
                  <p className="text-[11px] text-text-muted">
                    Grants permission to lead and manage assigned projects
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="rounded-xl text-[12px] h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !position.trim()}
              className="rounded-xl text-[12px] h-9 bg-[#101828] text-white hover:bg-black shadow-clay-button gap-1.5 font-medium px-4"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
