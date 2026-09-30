"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Settings2,
  Shield,
  Bell,
  Key,
  Laptop,
  Check,
  CheckCircle2,
  Save,
  Sparkles,
  Lock,
  Monitor,
} from "lucide-react";
import { SystemRole } from "@prisma/client";

interface WorkspaceSettingsViewProps {
  currentUser: {
    id: string;
    employeeId: string;
    name: string;
    email: string | null;
    systemRole: SystemRole;
    createdAt: string;
    lastLoginAt?: string | null;
  };
}

type SettingsTab =
  "general" | "notifications" | "appearance" | "security" | "roles";

export function WorkspaceSettingsView({
  currentUser,
}: WorkspaceSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Settings State
  const [workspaceName, setWorkspaceName] = useState("Dynamatrix Solutions");
  const [timezone, setTimezone] = useState("Asia/Kathmandu (NPT)");
  const [weekStart, setWeekStart] = useState("MONDAY");
  const [defaultTaskView, setDefaultTaskView] = useState("LIST");

  // Notification Preferences State
  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true);
  const [notifyReviewRequested, setNotifyReviewRequested] = useState(true);
  const [notifyDueSoon, setNotifyDueSoon] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);
  const [notifyDesktopSound, setNotifyDesktopSound] = useState(true);

  // Appearance State
  const [density, setDensity] = useState<"COMPACT" | "STANDARD">("COMPACT");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Settings2 className="size-5 text-primary" />
            Workspace Settings
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Configure workspace preferences, notification rules, operational
            display density, and security policies.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[12px] font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="size-4 text-[#15803D]" />
            Preferences saved
          </div>
        )}
      </div>

      {/* 2. Settings Grid (Nav + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar / Mobile Tab Strip */}
        <div className="flex flex-row overflow-x-auto pb-1 lg:pb-0 lg:flex-col gap-1 lg:gap-1.5 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 border-b lg:border-b-0 border-border">
          {[
            { id: "general", label: "General Workspace", icon: Settings2 },
            { id: "notifications", label: "Notification Rules", icon: Bell },
            { id: "appearance", label: "Display & Density", icon: Monitor },
            { id: "security", label: "Security & Sessions", icon: Key },
            { id: "roles", label: "Roles & Permissions", icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={`px-3 py-2 flex items-center gap-2 rounded-[6px] text-[12px] sm:text-[13px] font-medium transition-colors text-left whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <Icon
                  className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-text-muted"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave}>
            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      General Configuration
                    </h2>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      Default workspace localization, schedules, and task
                      viewing standards.
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Workspace Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border-subtle">
                    <div className="max-w-md">
                      <p className="font-semibold text-[13px] text-foreground">
                        Workspace Name
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        The organization name displayed in headers,
                        notifications, and navigation.
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-background text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-clay-inset"
                      />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border-subtle">
                    <div className="max-w-md">
                      <p className="font-semibold text-[13px] text-foreground">
                        Default Timezone
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        Determines deadline expiration, cutoff calculations, and
                        timeline alignments.
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-background text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-clay-inset"
                      >
                        <option value="Asia/Kathmandu (NPT)">
                          Asia/Kathmandu (NPT, UTC+5:45)
                        </option>
                        <option value="UTC">
                          UTC (Coordinated Universal Time)
                        </option>
                        <option value="America/New_York (EST)">
                          America/New_York (EST, UTC-5)
                        </option>
                        <option value="America/Los_Angeles (PST)">
                          America/Los_Angeles (PST, UTC-8)
                        </option>
                        <option value="Europe/London (GMT)">
                          Europe/London (GMT, UTC+0)
                        </option>
                        <option value="Asia/Tokyo (JST)">
                          Asia/Tokyo (JST, UTC+9)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Week Start */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border-subtle">
                    <div className="max-w-md">
                      <p className="font-semibold text-[13px] text-foreground">
                        First Day of Week
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        Sets the starting column for upcoming timelines and
                        calendar widgets.
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <select
                        value={weekStart}
                        onChange={(e) => setWeekStart(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-background text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-clay-inset"
                      >
                        <option value="MONDAY">Monday (Standard)</option>
                        <option value="SUNDAY">Sunday</option>
                      </select>
                    </div>
                  </div>

                  {/* Default Task View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                    <div className="max-w-md">
                      <p className="font-semibold text-[13px] text-foreground">
                        Default Task View
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        Preferred visual mode when opening project tasks.
                      </p>
                    </div>
                    <div className="w-full sm:w-64">
                      <select
                        value={defaultTaskView}
                        onChange={(e) => setDefaultTaskView(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border-subtle bg-background text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-clay-inset"
                      >
                        <option value="LIST">
                          Compact Table List (Recommended)
                        </option>
                        <option value="BOARD">Kanban Columns</option>
                      </select>
                    </div>
                  </div>

                  {/* Save Action */}
                  <div className="pt-3 border-t border-border-subtle flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="size-4" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      Notification Rules & Delivery
                    </h2>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      Configure which workspace events trigger in-app alerts and
                      notifications.
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {[
                    {
                      label: "Task Assignments & Reassignments",
                      desc: "Notify me immediately when I am assigned or reassigned to a technical deliverable.",
                      checked: notifyTaskAssigned,
                      onChange: () =>
                        setNotifyTaskAssigned(!notifyTaskAssigned),
                    },
                    {
                      label: "Review Requests & Submissions",
                      desc: "Notify me when tasks in my led projects are submitted for approval or require QA review.",
                      checked: notifyReviewRequested,
                      onChange: () =>
                        setNotifyReviewRequested(!notifyReviewRequested),
                    },
                    {
                      label: "Approaching Deadlines & Overdue Alerts",
                      desc: "Send high-priority reminders for tasks due within 24 hours or currently overdue.",
                      checked: notifyDueSoon,
                      onChange: () => setNotifyDueSoon(!notifyDueSoon),
                    },
                    {
                      label: "Audio Chime on In-App Alerts",
                      desc: "Play a subtle audio notification when a new alert arrives while the workspace is open.",
                      checked: notifyDesktopSound,
                      onChange: () =>
                        setNotifyDesktopSound(!notifyDesktopSound),
                    },
                    {
                      label: "Daily Email Digest",
                      desc: "Receive a concise summary email every morning with today’s priorities.",
                      checked: notifyEmailDigest,
                      onChange: () => setNotifyEmailDigest(!notifyEmailDigest),
                    },
                  ].map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-4 py-3 border-b border-border-subtle last:border-0"
                    >
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-semibold text-foreground">
                          {rule.label}
                        </p>
                        <p className="text-[12px] text-text-muted">
                          {rule.desc}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={rule.checked}
                          onChange={rule.onChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-surface-hover border border-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-border-subtle flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="size-4" />
                      Save Notification Rules
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      Display & Interface Density
                    </h2>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      Tailor operational comfort according to Section 1 & 4 of
                      the design guidelines.
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Density Option */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border-subtle">
                    <div className="max-w-md">
                      <p className="font-semibold text-[13px] text-foreground">
                        Operational Density
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        Compact mode optimizes for scannability with 40px table
                        rows and minimal padding.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDensity("COMPACT")}
                        className={`px-4 py-2 rounded-xl border text-[12px] font-semibold transition-colors ${
                          density === "COMPACT"
                            ? "bg-foreground text-surface border-foreground"
                            : "bg-surface text-text-secondary border-border-subtle hover:bg-surface-hover"
                        }`}
                      >
                        Compact (40px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDensity("STANDARD")}
                        className={`px-4 py-2 rounded-xl border text-[12px] font-semibold transition-colors ${
                          density === "STANDARD"
                            ? "bg-foreground text-surface border-foreground"
                            : "bg-surface text-text-secondary border-border-subtle hover:bg-surface-hover"
                        }`}
                      >
                        Standard (48px)
                      </button>
                    </div>
                  </div>

                  {/* Brand Color Token note */}
                  <div className="p-4 rounded-xl bg-background border border-border-subtle flex items-start gap-3 shadow-clay-inset">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        Design System Token
                      </p>
                      <p className="text-[12px] text-text-muted mt-0.5">
                        Active brand theme uses curated Dark Navy sidebar (
                        <code className="text-foreground font-mono text-[11px]">
                          #0B1020
                        </code>
                        ) with Brand Indigo accent (
                        <code className="text-primary font-mono text-[11px]">
                          #5B5FEF
                        </code>
                        ).
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="size-4" />
                      Save Display Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECURITY & SESSIONS */}
            {activeTab === "security" && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      Security & Active Sessions
                    </h2>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      Review authenticated devices, access timestamps, and
                      password policies.
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Current Session */}
                  <div className="p-4 rounded-xl bg-background border border-border-subtle flex items-center justify-between gap-4 shadow-clay-inset">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-surface border border-border">
                        <Laptop className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-foreground">
                            Current Session
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                            Active Now
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Logged in as {currentUser.name} (
                          {currentUser.employeeId})
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-[12px] font-semibold text-text-secondary transition-colors"
                    >
                      Update Password
                    </Link>
                  </div>

                  {/* Enterprise Security Policy info */}
                  <div className="p-5 rounded-xl border border-border-subtle bg-surface space-y-2 shadow-sm">
                    <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-primary" />
                      Enterprise Security Standards
                    </p>
                    <ul className="text-[12px] text-text-secondary space-y-1.5 list-disc pl-4">
                      <li>
                        Passwords require a minimum of 8 characters with bcrypt
                        salt hashing.
                      </li>
                      <li>
                        Single-session enforcement for administrative
                        operations.
                      </li>
                      <li>
                        Suspended or inactive accounts are immediately
                        terminated on next navigation.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROLES & PERMISSIONS */}
            {activeTab === "roles" && (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground">
                      Role Capabilities & Access Matrix
                    </h2>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      Operational permissions breakdown across company roles per
                      §3 of the workspace guidelines.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="border-b border-border bg-background text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                      <tr>
                        <th className="px-4 py-3 min-w-[200px]">Capability</th>
                        <th className="px-4 py-3 min-w-[120px]">Employee</th>
                        <th className="px-4 py-3 min-w-[140px]">
                          Project Lead
                        </th>
                        <th className="px-4 py-3 min-w-[120px]">
                          Administrator
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-[12px]">
                      {[
                        {
                          cap: "View assigned workspace tasks & upcoming",
                          emp: true,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Submit tasks for review & update progress",
                          emp: true,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Add knowledge resources to projects",
                          emp: true,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Create deliverables & assign tasks to members",
                          emp: false,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Approve & mark tasks completed",
                          emp: false,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Staff & remove project members",
                          emp: false,
                          lead: true,
                          admin: true,
                        },
                        {
                          cap: "Create & configure new project workspaces",
                          emp: false,
                          lead: false,
                          admin: true,
                        },
                        {
                          cap: "Manage corporate staff & reset credentials",
                          emp: false,
                          lead: false,
                          admin: true,
                        },
                      ].map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-surface-hover transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {row.cap}
                          </td>
                          <td className="px-4 py-3">
                            {row.emp ? (
                              <Check className="size-4 text-[#16A34A]" />
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.lead ? (
                              <Check className="size-4 text-[#16A34A]" />
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.admin ? (
                              <Check className="size-4 text-[#16A34A]" />
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
