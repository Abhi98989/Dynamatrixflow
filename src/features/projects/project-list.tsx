"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Download, Plus, Search, Table2, LayoutGrid, LayoutTemplate, MoreVertical } from "lucide-react";

const formatEnum = (val: string) =>
  val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

export interface ProjectItem {
  id: string;
  name: string;
  projectCode: string;
  clientName?: string | null;
  status: string;
  priority: string;
  deadline?: Date | string | null;
  progress?: number;
  projectLead?: { id?: string; name: string | null } | null;
  members?: { user?: { id?: string; name: string | null } | null }[];
}

export function ProjectList({
  projects,
  canCreate = true,
}: {
  projects: ProjectItem[];
  canCreate?: boolean;
}) {
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [leadFilter, setLeadFilter] = useState("ALL");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        (p.clientName || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || p.priority === priorityFilter;
      const matchLead = leadFilter === "ALL" || p.projectLead?.name === leadFilter;
      return matchSearch && matchStatus && matchPriority && matchLead;
    });
  }, [projects, search, statusFilter, priorityFilter, leadFilter]);

  const activeCount = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "PLANNING" || p.status === "ACTIVE").length;
  const blockedCount = projects.filter(p => p.status === "BLOCKED" || p.status === "ON_HOLD").length;
  const reviewCount = projects.filter(p => p.status === "IN_REVIEW").length;
  const completedCount = projects.filter(p => p.status === "COMPLETED").length;

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const leads = Array.from(new Set(projects.map(p => p.projectLead?.name).filter((name): name is string => typeof name === "string" && name.length > 0)));

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setLeadFilter("ALL");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-[10px] font-semibold text-[#667085] tracking-widest uppercase">
            WORKSPACE / ENGINEERING
          </span>
          <h1 className="text-[22px] font-semibold text-[#101828] tracking-tight mt-0.5">Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 h-8 border border-[#E4E7EC] rounded-md text-[13px] font-medium text-[#475467] hover:bg-[#F9FAFC] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          {canCreate && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 px-3 h-8 bg-[#5B5FEF] rounded-md text-[13px] font-semibold text-white hover:bg-[#4C50D8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </Link>
          )}
        </div>
      </div>

      {/* Stat row — compact, single line each */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active", value: activeCount, accent: "text-[#2563EB]", sub: "In flight" },
          { label: "Blocked", value: blockedCount, accent: "text-[#DC2626]", sub: "Needs attention" },
          { label: "In Review", value: reviewCount, accent: "text-[#7C3AED]", sub: "Awaiting signoff" },
          { label: "Completed", value: completedCount, accent: "text-[#15803D]", sub: "Delivered" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-[#E4E7EC] p-3">
            <span className="text-[11px] font-semibold text-[#667085] tracking-wider uppercase">{s.label}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-bold ${s.accent}`}>{s.value}</span>
              <span className="text-[11px] text-[#98A2B3]">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-8 pr-3 h-8 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#475467] focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="h-8 px-2.5 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#475467] focus:outline-none"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={leadFilter}
            onChange={e => setLeadFilter(e.target.value)}
            className="h-8 px-2.5 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#475467] focus:outline-none"
          >
            <option value="ALL">Lead: All</option>
            {leads.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-0.5 border border-[#E4E7EC] rounded-md p-0.5 bg-[#F9FAFC] shrink-0">
          <button
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
              view === "table" ? "bg-white text-[#101828] border border-[#E4E7EC]" : "text-[#667085] hover:text-[#475467]"
            }`}
            onClick={() => setView("table")}
          >
            <Table2 className="w-3.5 h-3.5" /> Table
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
              view === "grid" ? "bg-white text-[#101828] shadow-sm" : "text-[#667085] hover:text-[#475467]"
            }`}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
        </div>
      </div>

      {/* Empty */}
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 flex flex-col items-center text-center">
          <Search className="w-5 h-5 text-[#98A2B3] mb-3" />
          <h3 className="text-[15px] font-semibold text-[#101828] mb-1">No projects found</h3>
          <p className="text-[13px] text-[#667085] max-w-xs mb-4">
            No projects match your current filters.
          </p>
          <button onClick={clearFilters} className="text-[13px] font-semibold text-[#5B5FEF] hover:text-[#4C50D8]">
            Clear all filters
          </button>
        </div>
      )}

      {/* Table view */}
      {filteredProjects.length > 0 && view === "table" && (
        <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                <tr>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Project</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Status</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Priority</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Lead</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Team</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Deadline</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase w-28">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F7]">
                {filteredProjects.map(p => (
                  <tr key={p.id} className="hover:bg-[#F9FAFC] transition-colors h-11">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                          <LayoutTemplate className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${p.id}`}
                            className="block text-[13px] font-semibold text-[#101828] hover:text-[#5B5FEF] transition-colors truncate leading-tight"
                          >
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-[#98A2B3] font-mono">{p.projectCode}</span>
                            {p.clientName && (
                              <>
                                <span className="text-[#D0D5DD] text-[8px]">•</span>
                                <span className="text-[11px] text-[#98A2B3] truncate max-w-[120px]">{p.clientName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2 px-4">
                      <PriorityLabel priority={p.priority} />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#101828] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                          {getInitials(p.projectLead?.name || "?")}
                        </div>
                        <span className="text-[13px] text-[#475467] truncate max-w-[100px]">{p.projectLead?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center -space-x-1">
                        {p.members?.slice(0, 3).map((m, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full border-[1.5px] border-white flex items-center justify-center text-[8px] font-bold bg-[#EFF6FF] text-[#2563EB]"
                            title={m.user?.name || "Member"}
                          >
                            {getInitials(m.user?.name || "U")}
                          </div>
                        ))}
                        {(p.members?.length || 0) > 3 && (
                          <div className="w-5 h-5 rounded-full border-[1.5px] border-white bg-[#F2F4F7] text-[#667085] flex items-center justify-center text-[8px] font-bold">
                            +{(p.members?.length || 0) - 3}
                          </div>
                        )}
                        {(!p.members || p.members.length === 0) && (
                          <span className="text-[11px] text-[#98A2B3]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`text-[13px] font-medium ${
                        p.deadline && new Date(p.deadline).getTime() < now ? "text-[#DC2626]" : "text-[#475467]"
                      }`}>
                        {p.deadline
                          ? new Date(p.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[5px] bg-[#EAECF0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (p.progress || 0) === 100 ? "bg-[#16A34A]" : "bg-[#5B5FEF]"
                            }`}
                            style={{ width: `${p.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#475467] w-7 text-right tabular-nums">
                          {p.progress || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#E4E7EC] px-4 py-2.5 flex items-center justify-between bg-[#F9FAFB]">
            <span className="text-[12px] text-[#667085]">
              Showing <span className="font-semibold text-[#101828]">{filteredProjects.length}</span> of{" "}
              <span className="font-semibold text-[#101828]">{projects.length}</span> projects
            </span>
          </div>
        </div>
      )}

      {/* Grid view */}
      {filteredProjects.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProjects.map(p => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-white rounded-lg border border-[#E4E7EC] hover:border-[#5B5FEF]/30 transition-colors p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#101828] truncate">{p.name}</h3>
                    <span className="text-[11px] text-[#98A2B3] font-mono">{p.projectCode}</span>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-[#98A2B3] shrink-0" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={p.status} />
                <PriorityLabel priority={p.priority} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#F2F4F7]">
                <div className="flex items-center -space-x-1">
                  {p.members?.slice(0, 3).map((m, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-full border-[1.5px] border-white bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-[8px] font-bold"
                    >
                      {getInitials(m.user?.name || "U")}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-[5px] bg-[#EAECF0] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(p.progress || 0) === 100 ? "bg-[#16A34A]" : "bg-[#5B5FEF]"}`}
                      style={{ width: `${p.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#475467] tabular-nums">{p.progress || 0}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tiny sub-components ── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; bg: string; fg: string }> = {
    PLANNING:    { dot: "bg-[#667085]", bg: "bg-[#F2F4F7]", fg: "text-[#667085]" },
    ACTIVE:      { dot: "bg-[#2563EB]", bg: "bg-[#EFF6FF]", fg: "text-[#2563EB]" },
    IN_PROGRESS: { dot: "bg-[#2563EB]", bg: "bg-[#EFF6FF]", fg: "text-[#2563EB]" },
    ON_HOLD:     { dot: "bg-[#D97706]", bg: "bg-[#FFFBEB]", fg: "text-[#B45309]" },
    BLOCKED:     { dot: "bg-[#DC2626]", bg: "bg-[#FEF2F2]", fg: "text-[#DC2626]" },
    IN_REVIEW:   { dot: "bg-[#7C3AED]", bg: "bg-[#F5F3FF]", fg: "text-[#7C3AED]" },
    COMPLETED:   { dot: "bg-[#15803D]", bg: "bg-[#F0FDF4]", fg: "text-[#15803D]" },
    CANCELLED:   { dot: "bg-[#64748B]", bg: "bg-[#F1F5F9]", fg: "text-[#64748B]" },
    ARCHIVED:    { dot: "bg-[#64748B]", bg: "bg-[#F1F5F9]", fg: "text-[#64748B]" },
  };
  const s = map[status] ?? map.PLANNING!;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${s!.bg} ${s!.fg} text-[11px] font-bold`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s!.dot}`} />
      {formatEnum(status)}
    </span>
  );
}

function PriorityLabel({ priority }: { priority: string }) {
  const color: Record<string, string> = {
    CRITICAL: "text-[#DC2626]",
    HIGH: "text-[#EA580C]",
    MEDIUM: "text-[#D97706]",
    LOW: "text-[#64748B]",
  };
  return (
    <span className={`text-[11px] font-bold ${color[priority] || color.MEDIUM}`}>
      {formatEnum(priority)}
    </span>
  );
}
