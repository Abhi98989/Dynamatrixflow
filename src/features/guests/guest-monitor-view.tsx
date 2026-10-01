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
      <div className="max-w-3xl mx-auto py-14 text-center">
        <div className="bg-surface rounded-xl border border-border p-6">
          <ShieldCheck className="w-8 h-8 text-[#15803D] mx-auto mb-2" />
          <h2 className="text-base font-bold text-foreground">
            Guest Observer Portal
          </h2>
          <p className="text-xs text-text-muted mt-1">
            No projects linked to your account ({guestId}).
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
    { key: "in_progress" as const, label: "Active", count: inProgressTasks.length },
    { key: "upcoming" as const, label: "Pipeline", count: upcomingTasks.length },
    { key: "completed" as const, label: "Done", count: completedTasks.length },
    { key: "milestones" as const, label: "Roadmap", count: currentProject.milestones.length },
    { key: "resources" as const, label: "Files", count: currentProject.resources.length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* ─── Compact Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Welcome, {guestName}
            </h1>
            <span className="text-[10px] font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.5 rounded">
              Observer
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {guestId}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Track progress, milestones, and deliverables in real time.
          </p>
        </div>

        {projects.length > 1 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary min-w-[200px]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface rounded-xl p-3.5 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Progress</span>
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-foreground tabular-nums leading-none">{progressPercentage}</span>
            <span className="text-sm font-bold text-text-muted">%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden mt-2 bg-[#F1F4FA] shadow-clay-inset">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressPercentage === 100 ? "bg-[#16A34A]" : "bg-primary"}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted mt-1 block">{completedTasks.length}/{totalTasks} tasks</span>
        </div>

        <div className="bg-surface rounded-xl p-3.5 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Active</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </div>
          <span className="text-2xl font-extrabold text-primary tabular-nums leading-none">{inProgressTasks.length}</span>
          <p className="text-[10px] text-text-muted mt-1">in execution</p>
          {blockedTasks.length > 0 && (
            <span className="inline-flex text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mt-1">
              {blockedTasks.length} blocked
            </span>
          )}
        </div>

        <div className="bg-surface rounded-xl p-3.5 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Pipeline</span>
            <Layers className="w-3.5 h-3.5 text-[#D97706]" />
          </div>
          <span className="text-2xl font-extrabold text-[#D97706] tabular-nums leading-none">{upcomingTasks.length}</span>
          <p className="text-[10px] text-text-muted mt-1">queued</p>
        </div>

        <div className="bg-surface rounded-xl p-3.5 border border-border shadow-clay">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Milestones</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-extrabold text-[#15803D] tabular-nums leading-none">
              {currentProject.milestones.filter((m) => m.status === "COMPLETED").length}
            </span>
            <span className="text-sm font-bold text-text-muted">/{currentProject.milestones.length}</span>
          </div>
          <p className="text-[10px] text-[#15803D] mt-1">delivered</p>
        </div>
      </div>

      {/* ─── Project Info + Tabs ─── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Project header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/8 px-2 py-0.5 rounded border border-primary/15">
                {currentProject.projectCode}
              </span>
              <h2 className="text-sm font-bold text-foreground">{currentProject.name}</h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              {currentProject.projectLead && (
                <span className="bg-background px-2 py-1 rounded border border-border-subtle">
                  Lead: <strong className="text-foreground">{currentProject.projectLead.name}</strong>
                </span>
              )}
              {currentProject.deadline && (
                <span className="bg-background px-2 py-1 rounded border border-border-subtle flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  <strong className="text-foreground">
                    {new Date(currentProject.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </strong>
                </span>
              )}
            </div>
          </div>
          {currentProject.description && (
            <p className="text-[11px] text-text-muted mt-1.5 max-w-3xl leading-relaxed">{currentProject.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 bg-surface border-b border-border">
          <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-text-muted border-transparent hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                  activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-background text-text-muted"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* ACTIVE */}
          {activeTab === "in_progress" && (
            <div>
              {inProgressTasks.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-text-muted">No tasks in progress</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {inProgressTasks.map((task) => (
                    <div key={task.id} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors bg-[#FAFBFE]">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[9px] font-bold text-text-muted">{task.taskCode}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColor[task.priority] || priorityColor.MEDIUM}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-semibold text-foreground leading-snug">{task.title}</h4>
                      {task.description && (
                        <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.progress > 0 && (
                        <div className="w-full h-1 rounded-full overflow-hidden mt-2 bg-[#F1F4FA] shadow-clay-inset">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border-subtle text-[10px] text-text-muted">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold text-primary">
                            {task.status === "IN_REVIEW" ? "Review" : "Active"}
                          </span>
                        </div>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PIPELINE */}
          {activeTab === "upcoming" && (
            <div>
              {upcomingTasks.length === 0 ? (
                <div className="py-10 text-center">
                  <Clock className="w-6 h-6 text-[#D97706] mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-text-muted">No upcoming tasks</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle border border-border rounded-lg overflow-hidden">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="px-3 py-2.5 hover:bg-background transition-colors flex items-center justify-between gap-3 bg-surface">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[9px] text-text-muted">{task.taskCode}</span>
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded border ${priorityColor[task.priority]}`}>{task.priority}</span>
                        </div>
                        <h4 className="text-[13px] font-semibold text-foreground truncate">{task.title}</h4>
                      </div>
                      {task.dueDate ? (
                        <span className="text-[10px] text-text-muted flex items-center gap-1 shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted bg-background px-1.5 py-0.5 rounded shrink-0">Queued</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {activeTab === "completed" && (
            <div>
              {completedTasks.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-text-muted">No completed tasks yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle border border-border rounded-lg overflow-hidden">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="px-3 py-2.5 hover:bg-background transition-colors flex items-center justify-between gap-3 bg-surface">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono text-[9px] text-text-muted block">{task.taskCode}</span>
                          <h4 className="text-[13px] font-semibold text-foreground truncate">{task.title}</h4>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold shrink-0">DONE</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ROADMAP */}
          {activeTab === "milestones" && (
            <div className="space-y-2">
              {currentProject.milestones.length === 0 ? (
                <div className="py-10 text-center">
                  <Target className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-text-muted">No milestones yet</p>
                </div>
              ) : (
                currentProject.milestones.map((milestone, idx) => {
                  const isDone = milestone.status === "COMPLETED";
                  const isCurrent = milestone.status === "IN_PROGRESS";
                  return (
                    <div
                      key={milestone.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isDone ? "bg-surface border-emerald-200"
                          : isCurrent ? "bg-primary/3 border-primary/25" : "bg-surface border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isDone ? "bg-emerald-600 text-white" : isCurrent ? "bg-primary text-white" : "bg-background text-text-muted border border-border"
                          }`}>
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-foreground">{milestone.name}</h4>
                            {milestone.description && <p className="text-[11px] text-text-muted mt-0.5">{milestone.description}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isCurrent ? "bg-primary/10 text-primary border border-primary/20" : "bg-background text-text-muted border border-border"
                          }`}>
                            {formatEnum(milestone.status)}
                          </span>
                          {milestone.deadline && (
                            <p className="text-[10px] text-text-muted mt-1 flex items-center gap-0.5 justify-end">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(milestone.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

          {/* FILES */}
          {activeTab === "resources" && (
            <div>
              {currentProject.resources.length === 0 ? (
                <div className="py-10 text-center">
                  <FolderOpen className="w-6 h-6 text-text-muted mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-text-muted">No shared files yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentProject.resources.map((res) => {
                    const isFile = res.url.startsWith("/api/upload") || res.url.match(/\.(pdf|doc|docx|png|jpg|jpeg|svg|zip)$/i);
                    return (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-lg border border-border hover:border-primary/30 transition-colors flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center shrink-0">
                            {isFile ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[12px] font-semibold text-foreground group-hover:text-primary truncate">{res.title}</h4>
                            <span className="text-[9px] text-text-muted uppercase tracking-wider">{res.category}</span>
                          </div>
                        </div>
                        <div className="text-text-muted group-hover:text-primary shrink-0">
                          {isFile ? <Download className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
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
