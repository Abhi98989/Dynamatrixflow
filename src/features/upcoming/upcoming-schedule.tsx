"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Search,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  FolderKanban,
  ArrowUpRight,
  User as UserIcon,
  Layers,
  X,
} from "lucide-react";
import {
  TaskStatus,
  Priority,
  MilestoneStatus,
  ProjectStatus,
} from "@prisma/client";
import { TaskStatusDropdown } from "@/features/tasks/task-status-dropdown";

export interface UpcomingTaskItem {
  type: "TASK";
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  dueDate: string; // ISO string
  blockerReason?: string | null;
  projectId: string;
  project: {
    id: string;
    name: string;
    projectCode: string;
    projectLeadId?: string | null;
  };
  assignee?: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
  milestone?: {
    id: string;
    name: string;
    milestoneCode: string;
  } | null;
}

export interface UpcomingMilestoneItem {
  type: "MILESTONE";
  id: string;
  milestoneCode: string;
  name: string;
  status: MilestoneStatus;
  deadline: string; // ISO string
  projectId: string;
  project: {
    id: string;
    name: string;
    projectCode: string;
    projectLeadId?: string | null;
  };
  totalTasks: number;
  completedTasks: number;
}

export interface UpcomingProjectItem {
  type: "PROJECT";
  id: string;
  projectCode: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  deadline: string; // ISO string
  projectLead?: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
  totalTasks: number;
}

export type UpcomingItem =
  UpcomingTaskItem | UpcomingMilestoneItem | UpcomingProjectItem;

interface ProjectOption {
  id: string;
  name: string;
  projectCode: string;
}

interface UpcomingScheduleProps {
  currentUserId: string;
  isAdmin: boolean;
  tasks: UpcomingTaskItem[];
  milestones: UpcomingMilestoneItem[];
  projects: UpcomingProjectItem[];
  projectOptions: ProjectOption[];
}

type TimeHorizon = "ALL" | "OVERDUE" | "TODAY" | "THIS_WEEK" | "LATER";
type EntityTypeFilter = "ALL" | "TASK" | "MILESTONE" | "PROJECT";

export function UpcomingSchedule({
  currentUserId,
  isAdmin,
  tasks,
  milestones,
  projects,
  projectOptions,
}: UpcomingScheduleProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntityTypeFilter>("ALL");
  const [horizonFilter, setHorizonFilter] = useState<TimeHorizon>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [assignedOnly, setAssignedOnly] = useState<boolean>(false);

  // Combine items with normalized deadline dates
  const allItems = useMemo(() => {
    const list: Array<{ item: UpcomingItem; date: Date }> = [];

    tasks.forEach((t) => {
      list.push({ item: t, date: new Date(t.dueDate) });
    });

    milestones.forEach((m) => {
      list.push({ item: m, date: new Date(m.deadline) });
    });

    projects.forEach((p) => {
      list.push({ item: p, date: new Date(p.deadline) });
    });

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks, milestones, projects]);

  // Compute bucket helpers
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const getDaysDiff = React.useCallback(
    (targetDate: Date) => {
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    },
    [today],
  );

  const getUrgencyBucket = React.useCallback(
    (
      targetDate: Date,
    ): "OVERDUE" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "LATER" => {
      const diff = getDaysDiff(targetDate);
      if (diff < 0) return "OVERDUE";
      if (diff === 0) return "TODAY";
      if (diff === 1) return "TOMORROW";
      if (diff <= 7) return "THIS_WEEK";
      return "LATER";
    },
    [getDaysDiff],
  );

  // Metrics counts across all items
  const metrics = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let dueTomorrow = 0;
    let dueThisWeek = 0;

    allItems.forEach(({ date }) => {
      const bucket = getUrgencyBucket(date);
      if (bucket === "OVERDUE") overdue++;
      if (bucket === "TODAY") dueToday++;
      if (bucket === "TOMORROW") dueTomorrow++;
      if (bucket === "THIS_WEEK" || bucket === "TOMORROW" || bucket === "TODAY")
        dueThisWeek++;
    });

    return {
      overdue,
      dueToday,
      dueTomorrow,
      dueThisWeek,
      total: allItems.length,
    };
  }, [allItems, getUrgencyBucket]);

  // Filtered items
  const filteredList = useMemo(() => {
    return allItems.filter(({ item, date }) => {
      // Type filter
      if (typeFilter !== "ALL" && item.type !== typeFilter) {
        return false;
      }

      // Project filter
      if (selectedProjectId !== "ALL") {
        if (item.type === "PROJECT") {
          if (item.id !== selectedProjectId) return false;
        } else {
          if (item.projectId !== selectedProjectId) return false;
        }
      }

      // Assigned only (for tasks)
      if (assignedOnly) {
        if (item.type === "TASK") {
          if (item.assignee?.id !== currentUserId) return false;
        } else if (item.type === "PROJECT") {
          if (item.projectLead?.id !== currentUserId) return false;
        } else {
          return false;
        }
      }

      // Time horizon filter
      const bucket = getUrgencyBucket(date);
      if (horizonFilter === "OVERDUE" && bucket !== "OVERDUE") return false;
      if (horizonFilter === "TODAY" && bucket !== "TODAY") return false;
      if (
        horizonFilter === "THIS_WEEK" &&
        bucket !== "OVERDUE" &&
        bucket !== "TODAY" &&
        bucket !== "TOMORROW" &&
        bucket !== "THIS_WEEK"
      ) {
        return false;
      }
      if (horizonFilter === "LATER" && bucket !== "LATER") return false;

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        let matches = false;
        if (item.type === "TASK") {
          matches =
            item.title.toLowerCase().includes(q) ||
            item.taskCode.toLowerCase().includes(q) ||
            item.project.name.toLowerCase().includes(q) ||
            Boolean(item.assignee?.name.toLowerCase().includes(q));
        } else if (item.type === "MILESTONE") {
          matches =
            item.name.toLowerCase().includes(q) ||
            item.milestoneCode.toLowerCase().includes(q) ||
            item.project.name.toLowerCase().includes(q);
        } else if (item.type === "PROJECT") {
          matches =
            item.name.toLowerCase().includes(q) ||
            item.projectCode.toLowerCase().includes(q) ||
            Boolean(item.projectLead?.name.toLowerCase().includes(q));
        }
        if (!matches) return false;
      }

      return true;
    });
  }, [
    allItems,
    typeFilter,
    selectedProjectId,
    assignedOnly,
    horizonFilter,
    search,
    currentUserId,
    getUrgencyBucket,
  ]);

  // Group into §12 buckets
  const groupedBuckets = useMemo(() => {
    const buckets: Record<
      "OVERDUE" | "TODAY" | "TOMORROW" | "THIS_WEEK" | "LATER",
      Array<{ item: UpcomingItem; date: Date }>
    > = {
      OVERDUE: [],
      TODAY: [],
      TOMORROW: [],
      THIS_WEEK: [],
      LATER: [],
    };

    filteredList.forEach((entry) => {
      const b = getUrgencyBucket(entry.date);
      buckets[b].push(entry);
    });

    return buckets;
  }, [filteredList, getUrgencyBucket]);

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // Section configs per design skill §4, §6, §12
  const bucketConfigs = [
    {
      key: "OVERDUE" as const,
      label: "OVERDUE",
      sublabel: "Needs immediate attention",
      dot: "bg-[#DC2626]",
      tagBg: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
      headerBg: "bg-red-50/40 border-red-200/60",
      accentBorder: "border-l-[#DC2626]",
      items: groupedBuckets.OVERDUE,
    },
    {
      key: "TODAY" as const,
      label: "DUE TODAY",
      sublabel: "Targeted for completion by end of day",
      dot: "bg-[#B45309]",
      tagBg: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
      headerBg: "bg-amber-50/40 border-amber-200/60",
      accentBorder: "border-l-[#B45309]",
      items: groupedBuckets.TODAY,
    },
    {
      key: "TOMORROW" as const,
      label: "DUE TOMORROW",
      sublabel: "Coming up tomorrow",
      dot: "bg-[#2563EB]",
      tagBg: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
      headerBg: "bg-surface-hover border-border",
      accentBorder: "border-l-[#2563EB]",
      items: groupedBuckets.TOMORROW,
    },
    {
      key: "THIS_WEEK" as const,
      label: "DUE THIS WEEK",
      sublabel: "Next 2 to 7 days",
      dot: "bg-[#667085]",
      tagBg: "bg-surface-hover text-text-secondary border-border",
      headerBg: "bg-surface-hover border-border",
      accentBorder: "border-l-[#667085]",
      items: groupedBuckets.THIS_WEEK,
    },
    {
      key: "LATER" as const,
      label: "LATER DEADLINES",
      sublabel: "Scheduled past 7 days",
      dot: "bg-[#98A2B3]",
      tagBg: "bg-surface-hover text-text-muted border-border",
      headerBg: "bg-surface-hover border-border",
      accentBorder: "border-l-[#98A2B3]",
      items: groupedBuckets.LATER,
    },
  ];

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "ALL" ||
    horizonFilter !== "ALL" ||
    selectedProjectId !== "ALL" ||
    assignedOnly;

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setHorizonFilter("ALL");
    setSelectedProjectId("ALL");
    setAssignedOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" />
              Upcoming Deliverables & Deadlines
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {filteredList.length}{" "}
              {filteredList.length === 1 ? "deliverable" : "deliverables"}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-text-secondary">
            Chronological view of all upcoming deliverables, milestones, and
            project deadlines across your workspace.
          </p>
        </div>

        {/* Live Date Chip */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface border border-border px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-text-secondary">
          <Calendar className="size-3.5 text-primary" />
          <span>
            {today.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* 2. Attention Metrics Strip (§9: 3-5 cards, 0 shadow, 8px radius, flat border) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overdue Card */}
        <button
          type="button"
          onClick={() =>
            setHorizonFilter(horizonFilter === "OVERDUE" ? "ALL" : "OVERDUE")
          }
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            horizonFilter === "OVERDUE"
              ? "ring-2 ring-[#DC2626] border-[#DC2626] bg-[#FEF2F2]/60"
              : metrics.overdue > 0
                ? "bg-[#FEF2F2]/30 border-[#FECACA] hover:bg-[#FEF2F2]/60"
                : "bg-white border-border hover:bg-surface-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
              <AlertTriangle
                className={`size-3.5 ${metrics.overdue > 0 ? "text-[#DC2626]" : "text-text-muted"}`}
              />
              Overdue
            </span>
            {metrics.overdue > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-[22px] sm:text-[24px] font-bold tracking-tight ${
                metrics.overdue > 0 ? "text-[#DC2626]" : "text-foreground"
              }`}
            >
              {metrics.overdue}
            </span>
            <span className="text-[11px] text-text-muted">
              {metrics.overdue === 1 ? "deliverable" : "deliverables"}
            </span>
          </div>
        </button>

        {/* Due Today Card */}
        <button
          type="button"
          onClick={() =>
            setHorizonFilter(horizonFilter === "TODAY" ? "ALL" : "TODAY")
          }
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            horizonFilter === "TODAY"
              ? "ring-2 ring-[#B45309] border-[#B45309] bg-[#FFFBEB]"
              : metrics.dueToday > 0
                ? "bg-[#FFFBEB]/40 border-[#FDE68A] hover:bg-[#FFFBEB]/70"
                : "bg-white border-border hover:bg-surface-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
              <Clock
                className={`size-3.5 ${metrics.dueToday > 0 ? "text-[#B45309]" : "text-text-muted"}`}
              />
              Due Today
            </span>
            {metrics.dueToday > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#B45309]" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-[22px] sm:text-[24px] font-bold tracking-tight ${
                metrics.dueToday > 0 ? "text-[#B45309]" : "text-foreground"
              }`}
            >
              {metrics.dueToday}
            </span>
            <span className="text-[11px] text-text-muted">
              {metrics.dueToday === 1 ? "deliverable" : "deliverables"}
            </span>
          </div>
        </button>

        {/* Due This Week Card */}
        <button
          type="button"
          onClick={() =>
            setHorizonFilter(
              horizonFilter === "THIS_WEEK" ? "ALL" : "THIS_WEEK",
            )
          }
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            horizonFilter === "THIS_WEEK"
              ? "ring-2 ring-primary border-primary bg-[#EFF6FF]"
              : "bg-white border-border hover:bg-surface-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              This Week
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-foreground">
              {metrics.dueThisWeek}
            </span>
            <span className="text-[11px] text-text-muted">within 7 days</span>
          </div>
        </button>

        {/* Total Deliverables Card */}
        <button
          type="button"
          onClick={() => setHorizonFilter("ALL")}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            horizonFilter === "ALL" && !hasActiveFilters
              ? "ring-1 ring-primary border-border-subtle bg-white"
              : "bg-white border-border hover:bg-surface-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
              <Layers className="size-3.5 text-text-muted" />
              Total Upcoming
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-foreground">
              {metrics.total}
            </span>
            <span className="text-[11px] text-text-muted">
              tasks & checkpoints
            </span>
          </div>
        </button>
      </div>

      {/* 3. Dynamic Filter & Search Toolbar */}
      <div className="bg-surface border border-border rounded-[8px] p-3 sm:p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by task title, code, milestone, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[6px] border border-border-subtle bg-surface text-[13px] text-foreground placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-secondary"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            {projectOptions.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-9 px-2.5 rounded-[6px] border border-border-subtle bg-surface text-[12px] font-medium text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Projects</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode})
                  </option>
                ))}
              </select>
            )}

            {/* Entity Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as EntityTypeFilter)
              }
              className="h-9 px-2.5 rounded-[6px] border border-border-subtle bg-surface text-[12px] font-medium text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Types</option>
              <option value="TASK">Tasks Only</option>
              <option value="MILESTONE">Milestones Only</option>
              <option value="PROJECT">Projects Only</option>
            </select>

            {/* Scope / Assigned to me toggle */}
            <button
              type="button"
              onClick={() => setAssignedOnly(!assignedOnly)}
              className={`h-9 px-3 rounded-[6px] border text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                assignedOnly
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text-secondary border-border-subtle hover:bg-surface-hover"
              }`}
            >
              <UserIcon className="size-3.5" />
              <span>Assigned to Me</span>
            </button>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 px-2.5 text-[12px] font-semibold text-[#DC2626] hover:bg-red-50 rounded-[6px] transition-colors flex items-center gap-1"
              >
                <X className="size-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Time Horizon Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border-subtle touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted shrink-0 mr-1">
            Horizon:
          </span>
          {[
            { id: "ALL", label: "All Deadlines" },
            {
              id: "OVERDUE",
              label: `Overdue (${metrics.overdue})`,
              badge: metrics.overdue > 0 ? "text-[#DC2626]" : "",
            },
            {
              id: "TODAY",
              label: `Due Today (${metrics.dueToday})`,
              badge: metrics.dueToday > 0 ? "text-[#B45309]" : "",
            },
            { id: "THIS_WEEK", label: "Next 7 Days" },
            { id: "LATER", label: "Later" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHorizonFilter(tab.id as TimeHorizon)}
              className={`h-7 px-2.5 rounded-[4px] text-[11px] font-semibold whitespace-nowrap transition-colors ${
                horizonFilter === tab.id
                  ? "bg-[#101828] text-white"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <span className={tab.badge}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Grouped Urgency Buckets (§12: OVERDUE / TODAY / TOMORROW / THIS WEEK / LATER) */}
      {filteredList.length === 0 ? (
        <div className="bg-surface border border-border rounded-[8px] py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-hover text-primary mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="size-6 text-[#15803D]" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">
            No deadlines found
          </h3>
          <p className="text-[13px] text-text-muted mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? "No items match your active search or filters. Try adjusting your criteria."
              : "You're all caught up! There are no upcoming deadlines requiring immediate action."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-[6px] text-[12px] font-semibold hover:bg-primary-hover"
            >
              Clear Filters
            </button>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-subtle bg-surface text-text-secondary rounded-[6px] text-[12px] font-semibold hover:bg-surface-hover"
              >
                Browse Projects
              </Link>
              <Link
                href="/my-tasks"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-[6px] text-[12px] font-semibold hover:bg-primary-hover"
              >
                Go to My Tasks
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {bucketConfigs.map((bucket) => {
            if (bucket.items.length === 0) return null;

            return (
              <div
                key={bucket.key}
                className="bg-surface border border-border rounded-[8px] overflow-hidden"
              >
                {/* Bucket Header */}
                <div
                  className={`px-4 py-2.5 border-b border-border flex items-center justify-between ${bucket.headerBg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${bucket.dot}`} />
                    <span className="text-[12px] font-bold tracking-wider text-foreground">
                      {bucket.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${bucket.tagBg}`}
                    >
                      {bucket.items.length}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-text-muted ml-1">
                      — {bucket.sublabel}
                    </span>
                  </div>

                  <span className="text-[11px] text-text-muted font-medium">
                    {bucket.key === "OVERDUE" && "Past deadline"}
                    {bucket.key === "TODAY" && "Due today"}
                    {bucket.key === "TOMORROW" && "Due tomorrow"}
                    {bucket.key === "THIS_WEEK" && "Due in 2-7 days"}
                    {bucket.key === "LATER" && "Later checkpoints"}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#EEF1F5]">
                  {bucket.items.map(({ item, date }) => {
                    const daysDiff = getDaysDiff(date);
                    const isItemOverdue = daysDiff < 0;

                    if (item.type === "TASK") {
                      const isAssignee = item.assignee?.id === currentUserId;
                      const isLeadOrAdmin =
                        isAdmin || item.project.projectLeadId === currentUserId;

                      return (
                        <div
                          key={`task-${item.id}`}
                          className={`p-3.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-surface-hover transition-colors border-l-2 ${
                            isItemOverdue
                              ? "border-l-[#DC2626]"
                              : "border-l-transparent"
                          }`}
                        >
                          {/* Left: Task Identity & Title */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span
                              className={`mt-1 size-2 rounded-full shrink-0 ${
                                isItemOverdue
                                  ? "bg-[#DC2626]"
                                  : daysDiff === 0
                                    ? "bg-[#B45309]"
                                    : "bg-[#2563EB]"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Link
                                  href={`/projects/${item.projectId}/tasks/${item.id}`}
                                  className="text-[13px] font-semibold text-foreground hover:text-primary hover:underline truncate"
                                >
                                  {item.title}
                                </Link>
                                <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">
                                  {item.taskCode}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                                <Link
                                  href={`/projects/${item.projectId}`}
                                  className="text-primary font-medium hover:underline flex items-center gap-1"
                                >
                                  <FolderKanban className="size-3" />
                                  {item.project.name}
                                </Link>

                                {item.milestone && (
                                  <>
                                    <span>•</span>
                                    <span className="text-text-muted">
                                      Milestone: {item.milestone.name}
                                    </span>
                                  </>
                                )}

                                <span>•</span>
                                <span className="font-semibold text-text-secondary">
                                  {item.priority === Priority.CRITICAL && (
                                    <span className="text-[#DC2626] font-bold">
                                      Critical
                                    </span>
                                  )}
                                  {item.priority === Priority.HIGH && (
                                    <span className="text-[#EA580C] font-semibold">
                                      High
                                    </span>
                                  )}
                                  {item.priority === Priority.MEDIUM && (
                                    <span className="text-[#D97706]">
                                      Medium
                                    </span>
                                  )}
                                  {item.priority === Priority.LOW && (
                                    <span className="text-[#64748B]">Low</span>
                                  )}
                                </span>

                                {item.assignee && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-text-muted">
                                      <UserIcon className="size-3" />
                                      {item.assignee.name ||
                                        item.assignee.employeeId}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Dynamic Status Dropdown & Due Date Info */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                            {/* Inline Dynamic Status Changer */}
                            <TaskStatusDropdown
                              taskId={item.id}
                              currentStatus={item.status}
                              currentProgress={item.progress}
                              blockerReason={item.blockerReason}
                              isLeadOrAdmin={isLeadOrAdmin}
                              isAssignee={isAssignee}
                            />

                            {/* Due date tag */}
                            <div className="text-right min-w-[90px]">
                              <div
                                className={`text-[12px] font-bold ${
                                  isItemOverdue
                                    ? "text-[#DC2626]"
                                    : daysDiff === 0
                                      ? "text-[#B45309]"
                                      : "text-foreground"
                                }`}
                              >
                                {isItemOverdue
                                  ? `${Math.abs(daysDiff)}d overdue`
                                  : daysDiff === 0
                                    ? "Today"
                                    : daysDiff === 1
                                      ? "Tomorrow"
                                      : formatDate(date)}
                              </div>
                              <div className="text-[10px] text-text-muted">
                                {formatDate(date)}
                              </div>
                            </div>

                            {/* Quick Link Action */}
                            <Link
                              href={`/projects/${item.projectId}/tasks/${item.id}`}
                              className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                              title="View task detail"
                            >
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === "MILESTONE") {
                      const percent =
                        item.totalTasks > 0
                          ? Math.round(
                              (item.completedTasks / item.totalTasks) * 100,
                            )
                          : 0;

                      return (
                        <div
                          key={`milestone-${item.id}`}
                          className={`p-3.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-surface-hover transition-colors border-l-2 ${
                            isItemOverdue
                              ? "border-l-[#DC2626]"
                              : "border-l-[#7C3AED]"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="mt-1 size-2 rounded-full shrink-0 bg-[#7C3AED]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                                  Milestone
                                </span>
                                <Link
                                  href={`/projects/${item.projectId}/milestones`}
                                  className="text-[13px] font-semibold text-foreground hover:text-primary hover:underline truncate"
                                >
                                  {item.name}
                                </Link>
                                <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">
                                  {item.milestoneCode}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                                <Link
                                  href={`/projects/${item.projectId}`}
                                  className="text-primary font-medium hover:underline flex items-center gap-1"
                                >
                                  <FolderKanban className="size-3" />
                                  {item.project.name}
                                </Link>
                                <span>•</span>
                                <span>
                                  Tasks: {item.completedTasks}/{item.totalTasks}{" "}
                                  completed ({percent}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                            {/* Milestone Progress bar */}
                            <div className="w-24 sm:w-28">
                              <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                                <span>Progress</span>
                                <span className="font-bold">{percent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#EAECF0] rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${percent === 100 ? "bg-[#16A34A]" : "bg-primary"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            {/* Due date tag */}
                            <div className="text-right min-w-[90px]">
                              <div
                                className={`text-[12px] font-bold ${
                                  isItemOverdue
                                    ? "text-[#DC2626]"
                                    : daysDiff === 0
                                      ? "text-[#B45309]"
                                      : "text-foreground"
                                }`}
                              >
                                {isItemOverdue
                                  ? `${Math.abs(daysDiff)}d overdue`
                                  : daysDiff === 0
                                    ? "Today"
                                    : daysDiff === 1
                                      ? "Tomorrow"
                                      : formatDate(date)}
                              </div>
                              <div className="text-[10px] text-text-muted">
                                {formatDate(date)}
                              </div>
                            </div>

                            <Link
                              href={`/projects/${item.projectId}/milestones`}
                              className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                              title="View milestones"
                            >
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === "PROJECT") {
                      return (
                        <div
                          key={`project-${item.id}`}
                          className={`p-3.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-surface-hover transition-colors border-l-2 ${
                            isItemOverdue
                              ? "border-l-[#DC2626]"
                              : "border-l-[#06B6D4]"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="mt-1 size-2 rounded-full shrink-0 bg-[#06B6D4]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC]">
                                  Project Deadline
                                </span>
                                <Link
                                  href={`/projects/${item.id}`}
                                  className="text-[13px] font-semibold text-foreground hover:text-primary hover:underline truncate"
                                >
                                  {item.name}
                                </Link>
                                <span className="text-[10px] font-mono text-text-muted bg-surface-hover px-1.5 py-0.5 rounded">
                                  {item.projectCode}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                                <span className="text-text-muted">
                                  Status: {item.status}
                                </span>
                                {item.projectLead && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Lead:{" "}
                                      {item.projectLead.name ||
                                        item.projectLead.employeeId}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span>Total tasks: {item.totalTasks}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle">
                            <div className="text-right min-w-[90px]">
                              <div
                                className={`text-[12px] font-bold ${
                                  isItemOverdue
                                    ? "text-[#DC2626]"
                                    : daysDiff === 0
                                      ? "text-[#B45309]"
                                      : "text-foreground"
                                }`}
                              >
                                {isItemOverdue
                                  ? `${Math.abs(daysDiff)}d overdue`
                                  : daysDiff === 0
                                    ? "Today"
                                    : daysDiff === 1
                                      ? "Tomorrow"
                                      : formatDate(date)}
                              </div>
                              <div className="text-[10px] text-text-muted">
                                {formatDate(date)}
                              </div>
                            </div>

                            <Link
                              href={`/projects/${item.id}`}
                              className="p-1 rounded text-text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                              title="View project workspace"
                            >
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
