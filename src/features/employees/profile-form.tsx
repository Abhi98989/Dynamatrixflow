"use client";

import * as React from "react";
import { useState, useActionState, useTransition } from "react";
import { updateOwnProfileAction, changeOwnPasswordAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  Briefcase,
  Hash,
} from "lucide-react";

interface ProfileFormProps {
  user: {
    id: string;
    employeeId: string;
    name: string;
    email: string | null;
    position: string | null;
    systemRole: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    changeOwnPasswordAction,
    undefined,
  );

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMsg(null);
    const formData = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const res = await updateOwnProfileAction(formData);
      if (res?.error) {
        setProfileMsg({ type: "error", text: res.error });
      } else {
        setProfileMsg({
          type: "success",
          text: "Profile details updated successfully.",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Edit Profile Details */}
      <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
              <User className="size-4 text-primary" />
              Personal Information
            </h2>
            <p className="text-[12px] text-text-muted mt-0.5">
              Update your display name and contact email address.
            </p>
          </div>
        </div>

        <div className="p-5">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMsg && (
              <div
                className={`p-3 rounded-[6px] text-[12px] font-medium flex items-center gap-2 border ${
                  profileMsg.type === "success"
                    ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                    : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <Check className="size-4 shrink-0 text-[#15803D]" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-[#DC2626]" />
                )}
                {profileMsg.text}
              </div>
            )}

            {/* Readonly Corporate Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-hover rounded-[6px] border border-border-subtle">
              <div>
                <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                  <Hash className="size-3" /> Employee ID
                </span>
                <p className="text-[12px] font-mono font-bold text-foreground mt-0.5">
                  {user.employeeId}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                  <Briefcase className="size-3" /> Position
                </span>
                <p className="text-[12px] font-semibold text-foreground mt-0.5">
                  {user.position || "Staff Member"}
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-[12px] font-semibold text-foreground"
              >
                Full Name <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                minLength={2}
                className="h-9 text-[13px] rounded-[6px]"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[12px] font-semibold text-foreground"
              >
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="name@dynamatrix.com"
                className="h-9 text-[13px] rounded-[6px]"
              />
              <p className="text-[11px] text-text-muted">
                Used for notification dispatches and account communication.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProfilePending}
                className="w-full h-9 rounded-[6px] bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isProfilePending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isProfilePending ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Security & Password */}
      <div className="bg-surface rounded-[8px] border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              Security & Credentials
            </h2>
            <p className="text-[12px] text-text-muted mt-0.5">
              Maintain account password credentials. Minimum 8 characters.
            </p>
          </div>
        </div>

        <div className="p-5">
          <form action={passwordFormAction} className="space-y-4">
            {passwordState?.error && (
              <div className="p-3 rounded-[6px] text-[12px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-[#DC2626]" />
                {passwordState.error}
              </div>
            )}

            {passwordState?.success && (
              <div className="p-3 rounded-[6px] text-[12px] font-medium bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#15803D]" />
                Password updated successfully.
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="currentPassword"
                className="text-[12px] font-semibold text-foreground"
              >
                Current Password <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="h-9 text-[13px] rounded-[6px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="newPassword"
                className="text-[12px] font-semibold text-foreground"
              >
                New Password <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                className="h-9 text-[13px] rounded-[6px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-[12px] font-semibold text-foreground"
              >
                Confirm New Password <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="h-9 text-[13px] rounded-[6px]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPasswordPending}
                className="w-full h-9 rounded-[6px] border border-border-subtle bg-surface hover:bg-surface-hover text-foreground text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPasswordPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                {isPasswordPending ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
