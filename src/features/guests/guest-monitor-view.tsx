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
      <div className="max-w-4xl mx-auto py-16 text-center bg-surface rounded-xl border border-border p-8">
        <ShieldCheck className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground">
          Guest Observer Portal
        </h2>
        <p className="text-sm text-text-muted mt-1">
          You are signed in as a Guest ({guestId}), but no projects are
          currently linked to your observer account.
        </p>
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1020] text-white rounded-2xl p-5 sm:p-7 border border-[#1E293B] relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Guest Observer Portal
              </span>
              <span className="font-mono text-[11px] text-[#94A3B8]">
                ID: {guestId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome, {guestName}
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xl">
              Live executive monitoring dashboard for your projects. Track
              ongoing tasks, delivery roadmaps, and completion metrics in real
              time.
            </p>
          </div>

          {/* Project Selector if multiple */}
          {projects.length > 1 && (
            <div className="bg-[#1E293B]/80 p-3 rounded-xl border border-[#334155]/60 min-w-[240px]">
              <label className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-bold mb-1.5">
                Switch Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
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

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Progress Gauge */}
        <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              Overall Progress
            </span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                {progressPercentage}%
              </span>
              <span className="text-xs font-medium text-text-muted">
                completed
              </span>
            </div>
            <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercentage === 100 ? "bg-[#16A34A]" : "bg-primary"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-text-muted font-medium">
            {completedTasks.length} of {totalTasks} total tasks finished
          </span>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              In Process
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tabular-nums tracking-tight">
              {inProgressTasks.length}
            </div>
            <p className="text-xs font-medium text-text-muted mt-1">
              tasks currently active
            </p>
          </div>
          <span className="text-[11px] text-[#2563EB] font-semibold flex items-center gap-1">
            Engineers actively executing
          </span>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              Upcoming
            </span>
            <Calendar className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#D97706] tabular-nums tracking-tight">
              {upcomingTasks.length}
            </div>
            <p className="text-xs font-medium text-text-muted mt-1">
              tasks in queue
            </p>
          </div>
          <span className="text-[11px] text-text-muted font-medium">
            Scheduled for upcoming sprints
          </span>
        </div>

        {/* Milestones Done */}
        <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">
              Milestones
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#15803D] tabular-nums tracking-tight">
              {
                currentProject.milestones.filter(
                  (m) => m.status === "COMPLETED",
                ).length
              }
              <span className="text-lg font-bold text-text-muted">
                /{currentProject.milestones.length}
              </span>
            </div>
            <p className="text-xs font-medium text-text-muted mt-1">
              milestones achieved
            </p>
          </div>
          <span className="text-[11px] text-[#15803D] font-medium">
            Delivery phases on schedule
          </span>
        </div>
      </div>

      {/* Project Meta Information Card */}
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F2F4F7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {currentProject.projectCode}
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {currentProject.name}
              </h2>
            </div>
            {currentProject.description && (
              <p className="text-xs text-text-secondary mt-1.5 max-w-3xl leading-relaxed">
                {currentProject.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
            {currentProject.projectLead && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <span className="text-[11px] text-[#64748B]">Lead:</span>
                <span className="font-semibold text-foreground">
                  {currentProject.projectLead.name}
                </span>
              </div>
            )}
            {currentProject.deadline && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-[#64748B]">Deadline:</span>
                <span className="font-semibold text-foreground">
                  {new Date(currentProject.deadline).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 pt-4 border-b border-[#F2F4F7] overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "in_progress"
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>In Process Work</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
              {inProgressTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "upcoming"
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>Upcoming Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {upcomingTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "completed"
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>Completed Deliverables</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {completedTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "milestones"
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>Milestone Roadmap</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-800 font-bold">
              {currentProject.milestones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "resources"
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-foreground"
            }`}
          >
            <span>Shared Files & Links</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
              {currentProject.resources.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-4">
          {/* TAB 1: IN PROCESS */}
          {activeTab === "in_progress" && (
            <div>
              {inProgressTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-50" />
                  No tasks currently in progress. All active sprints are up to
                  date!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-border hover:border-primary/40 transition-colors bg-[#FAFAFA] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold text-[#64748B] bg-surface border border-[#E2E8F0] px-2 py-0.5 rounded">
                            {task.taskCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              priorityColor[task.priority] ||
                              priorityColor.MEDIUM
                            }`}
                          >
                            {task.priority} PRIORITY
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground leading-snug">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EAEAEA] text-[11px] text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="font-medium text-[#2563EB]">
                            {task.status === "IN_REVIEW"
                              ? "Under Final Review"
                              : "In Progress"}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-muted" />
                            <span>
                              Target:{" "}
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

          {/* TAB 2: UPCOMING TASKS */}
          {activeTab === "upcoming" && (
            <div>
              {upcomingTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No upcoming tasks queued.
                </div>
              ) : (
                <div className="divide-y divide-[#F2F4F7] border border-border rounded-xl overflow-hidden bg-surface">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 sm:p-4 hover:bg-surface-hover transition-colors flex items-center justify-between gap-4"
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
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        {task.dueDate ? (
                          <span className="text-[11px] text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-text-muted" />
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted">
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

          {/* TAB 3: COMPLETED DELIVERABLES */}
          {activeTab === "completed" && (
            <div>
              {completedTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  Tasks have not yet moved to completed state.
                </div>
              ) : (
                <div className="divide-y divide-[#F2F4F7] border border-border rounded-xl overflow-hidden bg-surface">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 sm:p-4 hover:bg-surface-hover transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] text-text-muted block">
                            {task.taskCode}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {task.title}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          COMPLETED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MILESTONE ROADMAP */}
          {activeTab === "milestones" && (
            <div className="space-y-3">
              {currentProject.milestones.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No milestones specified for this project yet.
                </div>
              ) : (
                currentProject.milestones.map((milestone, idx) => {
                  const isDone = milestone.status === "COMPLETED";
                  const isCurrent = milestone.status === "IN_PROGRESS";

                  return (
                    <div
                      key={milestone.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? "bg-white border-emerald-200"
                          : isCurrent
                            ? "bg-blue-50/40 border-blue-200 ring-1 ring-blue-200"
                            : "bg-white border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isDone
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">
                              {milestone.name}
                            </h4>
                            {milestone.description && (
                              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              isDone
                                ? "bg-emerald-100 text-emerald-800"
                                : isCurrent
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {formatEnum(milestone.status)}
                          </span>
                          {milestone.deadline && (
                            <p className="text-[11px] text-text-muted mt-1">
                              Target:{" "}
                              {new Date(milestone.deadline).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
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

          {/* TAB 5: RESOURCES & DELIVERABLES */}
          {activeTab === "resources" && (
            <div>
              {currentProject.resources.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  No shared resources or files published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentProject.resources.map((res) => {
                    const isFile =
                      res.url.startsWith("/api/upload") ||
                      res.url.match(/\.(pdf|doc|docx|png|jpg|jpeg|svg|zip)$/i);

                    return (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl border border-border hover:border-primary hover:bg-surface-hover transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            {isFile ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ExternalLink className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {res.title}
                            </h4>
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                              {res.category}
                            </span>
                          </div>
                        </div>

                        <div className="p-1 text-text-muted group-hover:text-primary transition-colors shrink-0">
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
