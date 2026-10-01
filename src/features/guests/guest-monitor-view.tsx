"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  FileText,
  ExternalLink,
  Download,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  FolderOpen,
} from "lucide-react";

export interface GuestProjectData {
  id: string;
  name: string;
  projectCode: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  deadline: string | null;
  projectLead: { name: string; position: string | null } | null;
  tasks: Array<{
    id: string;
    taskCode: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    dueDate: string | null;
    completedAt: string | null;
    assignee: { name: string; position: string | null } | null;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    deadline: string | null;
    progressOverride: number | null;
  }>;
  resources: Array<{
    id: string;
    title: string;
    url: string;
    category: string;
    createdAt: string;
  }>;
}

interface GuestMonitorViewProps {
  guestName: string;
  guestId: string;
  projects: GuestProjectData[];
}

export function GuestMonitorView({
  guestName,
  guestId,
  projects,
}: GuestMonitorViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || "",
  );
  const [activeTab, setActiveTab] = useState<
    "in_progress" | "upcoming" | "completed" | "milestones" | "resources"
  >("in_progress");

  const currentProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  if (!currentProject) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] p-10 shadow-clay">
          <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-8 h-8 text-[#15803D]" />
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Guest Observer Portal
          </h2>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
            You are signed in as a Guest ({guestId}), but no projects are
            currently linked to your observer account.
          </p>
        </div>
      </div>
    );
  }

  const allTasks = currentProject.tasks;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");
  const inProgressTasks = allTasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW",
  );
  const upcomingTasks = allTasks.filter((t) => t.status === "TODO");
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED");

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const formatEnum = (val: string) =>
    val
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const priorityColor: Record<string, string> = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const tabs = [
    {
      key: "in_progress" as const,
      label: "Active Work",
      count: inProgressTasks.length,
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      color: "bg-primary/10 text-primary",
    },
    {
      key: "upcoming" as const,
      label: "Pipeline",
      count: upcomingTasks.length,
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "bg-amber-50 text-amber-700",
    },
    {
      key: "completed" as const,
      label: "Delivered",
      count: completedTasks.length,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "milestones" as const,
      label: "Roadmap",
      count: currentProject.milestones.length,
      icon: <Target className="w-3.5 h-3.5" />,
      color: "bg-slate-100 text-slate-600",
    },
    {
      key: "resources" as const,
      label: "Resources",
      count: currentProject.resources.length,
      icon: <FolderOpen className="w-3.5 h-3.5" />,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      {/* ─── Header Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1E293B] bg-gradient-to-br from-[#0B1020] via-[#0F172A] to-[#0B1020]"
        style={{
          boxShadow:
            "12px 12px 28px rgba(0,0,0,0.35), -8px -8px 20px rgba(30,58,138,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/25 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Observer Portal
              </span>
              <span className="font-mono text-[11px] text-[#64748B] bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                {guestId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white leading-tight">
              Welcome, {guestName}
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
              Real-time executive monitoring dashboard — track progress,
              delivery milestones, and team velocity across your projects.
            </p>
          </div>

          {/* Project selector */}
          {projects.length > 1 && (
            <div
              className="min-w-[260px] p-4 rounded-xl border border-[#334155]/50 bg-[#1E293B]/60 backdrop-blur-sm"
              style={{
                boxShadow:
                  "inset 3px 3px 8px rgba(0,0,0,0.2), inset -3px -3px 8px rgba(255,255,255,0.03)",
              }}
            >
              <label className="text-[10px] text-[#94A3B8] uppercase tracking-widest block font-bold mb-2">
                Active Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155]/80 rounded-xl px-3.5 py-2 text-[13px] text-white focus:outline-none focus:border-primary transition-colors"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-60 h-60 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* ─── KPI Summary Widgets (Clay) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[148px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
              Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[36px] font-extrabold text-foreground tabular-nums tracking-tighter leading-none">
                {progressPercentage}
              </span>
              <span className="text-lg font-bold text-text-muted">%</span>
            </div>
            <div
              className="w-full h-2.5 rounded-full overflow-hidden mt-3 border border-[rgba(220,227,240,0.8)]"
              style={{ boxShadow: "var(--shadow-clay-inset)", background: "#F8FAFF" }}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  progressPercentage === 100 ? "bg-[#16A34A]" : "bg-primary"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-text-muted mt-2 block">
              {completedTasks.length}/{totalTasks} deliverables
            </span>
          </div>
        </div>

        {/* Active Work */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[148px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
              Active
            </span>
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-[36px] font-extrabold text-primary tabular-nums tracking-tighter leading-none">
              {inProgressTasks.length}
            </span>
            <p className="text-[11px] font-medium text-text-muted mt-1">
              tasks in execution
            </p>
            {blockedTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                {blockedTasks.length} blocked
              </span>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[148px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
              Pipeline
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-auto">
            <span className="text-[36px] font-extrabold text-[#D97706] tabular-nums tracking-tighter leading-none">
              {upcomingTasks.length}
            </span>
            <p className="text-[11px] font-medium text-text-muted mt-1">
              queued for next sprints
            </p>
          </div>
        </div>

        {/* Milestones */}
        <div
          className="bg-surface rounded-2xl p-5 border border-[rgba(220,227,240,0.9)] flex flex-col justify-between min-h-[148px]"
          style={{ boxShadow: "var(--shadow-clay)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
              Milestones
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-[36px] font-extrabold text-[#15803D] tabular-nums tracking-tighter leading-none">
                {currentProject.milestones.filter((m) => m.status === "COMPLETED").length}
              </span>
              <span className="text-lg font-bold text-text-muted">
                /{currentProject.milestones.length}
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#15803D] mt-1">
              phases delivered
            </p>
          </div>
        </div>
      </div>

      {/* ─── Project Meta Card (Clay) ─── */}
      <div
        className="bg-surface rounded-2xl border border-[rgba(220,227,240,0.9)] overflow-hidden"
        style={{ boxShadow: "var(--shadow-clay)" }}
      >
        {/* Project header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-lg border border-primary/15">
                  {currentProject.projectCode}
                </span>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {currentProject.name}
                </h2>
              </div>
              {currentProject.description && (
                <p className="text-[13px] text-text-secondary mt-2 max-w-3xl leading-relaxed">
                  {currentProject.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {currentProject.projectLead && (
                <div
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[rgba(220,227,240,0.8)] bg-[#F8FAFF] text-xs"
                  style={{ boxShadow: "var(--shadow-clay-inset)" }}
                >
                  <span className="text-text-muted">Lead:</span>
                  <span className="font-semibold text-foreground">
                    {currentProject.projectLead.name}
                  </span>
                </div>
              )}
              {currentProject.deadline && (
                <div
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[rgba(220,227,240,0.8)] bg-[#F8FAFF] text-xs"
                  style={{ boxShadow: "var(--shadow-clay-inset)" }}
                >
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-text-muted">Due:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(currentProject.deadline).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-1 bg-surface border-b border-border">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-text-muted border-transparent hover:text-foreground hover:border-border"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-background text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB: ACTIVE WORK */}
          {activeTab === "in_progress" && (
            <div>
              {inProgressTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    All clear
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    No tasks currently in progress
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-border bg-[#FAFBFE] hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-mono text-[10px] font-bold text-text-muted bg-surface border border-border px-2 py-0.5 rounded-md">
                          {task.taskCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            priorityColor[task.priority] || priorityColor.MEDIUM
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[12px] text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      {task.progress > 0 && (
                        <div className="mt-3">
                          <div
                            className="w-full h-1.5 rounded-full overflow-hidden border border-[rgba(220,227,240,0.6)]"
                            style={{
                              boxShadow: "var(--shadow-clay-inset)",
                              background: "#F8FAFF",
                            }}
                          >
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle text-[11px] text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold text-primary">
                            {task.status === "IN_REVIEW"
                              ? "Under Review"
                              : "In Progress"}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PIPELINE */}
          {activeTab === "upcoming" && (
            <div>
              {upcomingTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <Clock className="w-7 h-7 text-[#D97706]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Pipeline empty
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    No upcoming tasks queued
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle border border-border rounded-xl overflow-hidden">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-background transition-colors flex items-center justify-between gap-4 bg-surface"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] text-text-muted">
                            {task.taskCode}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColor[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        {task.dueDate ? (
                          <span className="text-[11px] text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted bg-background px-2 py-0.5 rounded-md">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: DELIVERED */}
          {activeTab === "completed" && (
            <div>
              {completedTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <CheckCircle2 className="w-7 h-7 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No deliverables yet
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Tasks have not moved to completed state
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle border border-border rounded-xl overflow-hidden">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-background transition-colors flex items-center justify-between gap-4 bg-surface"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] text-text-muted block">
                            {task.taskCode}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {task.title}
                          </h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                        DELIVERED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ROADMAP */}
          {activeTab === "milestones" && (
            <div className="space-y-3">
              {currentProject.milestones.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <Target className="w-7 h-7 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No milestones
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    No milestones specified for this project yet
                  </p>
                </div>
              ) : (
                currentProject.milestones.map((milestone, idx) => {
                  const isDone = milestone.status === "COMPLETED";
                  const isCurrent = milestone.status === "IN_PROGRESS";

                  return (
                    <div
                      key={milestone.id}
                      className={`p-5 rounded-xl border transition-all ${
                        isDone
                          ? "bg-surface border-emerald-200"
                          : isCurrent
                            ? "bg-[#F8FAFF] border-primary/30 ring-1 ring-primary/15"
                            : "bg-surface border-border"
                      }`}
                      style={
                        isCurrent
                          ? { boxShadow: "var(--shadow-clay)" }
                          : undefined
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isDone
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                  ? "bg-primary text-white"
                                  : "bg-background text-text-muted border border-border"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-foreground">
                              {milestone.name}
                            </h4>
                            {milestone.description && (
                              <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isCurrent
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-background text-text-muted border border-border"
                            }`}
                          >
                            {formatEnum(milestone.status)}
                          </span>
                          {milestone.deadline && (
                            <p className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1 justify-end">
                              <Calendar className="w-3 h-3" />
                              {new Date(
                                milestone.deadline,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: RESOURCES */}
          {activeTab === "resources" && (
            <div>
              {currentProject.resources.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    className="w-14 h-14 rounded-2xl bg-surface border border-[rgba(220,227,240,0.9)] flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "var(--shadow-clay)" }}
                  >
                    <FolderOpen className="w-7 h-7 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No resources
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    No shared files or links published yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentProject.resources.map((res) => {
                    const isFile =
                      res.url.startsWith("/api/upload") ||
                      res.url.match(
                        /\.(pdf|doc|docx|png|jpg|jpeg|svg|zip)$/i,
                      );

                    return (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface hover:bg-[#FAFBFE] transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                            {isFile ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <ExternalLink className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {res.title}
                            </h4>
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                              {res.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-1.5 text-text-muted group-hover:text-primary transition-colors shrink-0">
                          {isFile ? (
                            <Download className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
