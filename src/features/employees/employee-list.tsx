"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  UserCheck,
  Briefcase,
  Shield,
  ArrowUpRight,
  KeyRound,
  UserX,
  Star,
  X,
} from "lucide-react";
import { SystemRole, AccountStatus } from "@prisma/client";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { StatusDialog } from "./status-dialog";

export interface EmployeeItem {
  id: string;
  employeeId: string;
  name: string;
  email: string | null;
  position: string | null;
  systemRole: SystemRole;
  accountStatus: AccountStatus;
  createdAt: string | Date;
  lastLoginAt?: string | Date | null;
  projectMemberships: Array<{
    id: string;
    projectRole: string;
    project: {
      id: string;
      name: string;
      projectCode: string;
      status: string;
    };
  }>;
  projectsLed: Array<{
    id: string;
    name: string;
    projectCode: string;
  }>;
  activeTasksCount: number;
  blockedTasksCount: number;
  inProgressTasksCount: number;
  totalTasksAssigned: number;
  totalProjectsCount: number;
}

interface EmployeeListProps {
  employees: EmployeeItem[];
  isAdmin: boolean;
}

type WorkloadFilter = "ALL" | "ASSIGNED" | "AVAILABLE";
type SortOption = "ID_ASC" | "ID_DESC" | "NAME_AZ" | "TASKS_DESC" | "PROJECTS_DESC";

export function EmployeeList({ employees, isAdmin }: EmployeeListProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("ID_ASC");

  // Summary attention metrics (§9)
  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.accountStatus === AccountStatus.ACTIVE).length;
    const leadsAndAdmins = employees.filter(
      (e) => e.systemRole === SystemRole.ADMIN || e.systemRole === SystemRole.PROJECT_LEAD
    ).length;
    const available = employees.filter(
      (e) => e.accountStatus === AccountStatus.ACTIVE && e.activeTasksCount <= 1
    ).length;

    return { total, active, leadsAndAdmins, available };
  }, [employees]);

  // Filtering & Sorting
  const filteredEmployees = useMemo(() => {
    let list = employees.filter((emp) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = emp.employeeId.toLowerCase().includes(q);
        const matchesPosition = Boolean(emp.position?.toLowerCase().includes(q));
        const matchesEmail = Boolean(emp.email?.toLowerCase().includes(q));
        const matchesProject = emp.projectMemberships.some(
          (pm) =>
            pm.project.name.toLowerCase().includes(q) ||
            pm.project.projectCode.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesId && !matchesPosition && !matchesEmail && !matchesProject) {
          return false;
        }
      }

      // 2. Role Filter
      if (roleFilter !== "ALL" && emp.systemRole !== roleFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== "ALL" && emp.accountStatus !== statusFilter) {
        return false;
      }

      // 4. Workload Filter
      if (workloadFilter === "ASSIGNED" && emp.totalProjectsCount === 0) {
        return false;
      }
      if (workloadFilter === "AVAILABLE" && emp.activeTasksCount > 1) {
        return false;
      }

      return true;
    });

    // Sort list
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "ID_ASC":
          return a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true });
        case "ID_DESC":
          return b.employeeId.localeCompare(a.employeeId, undefined, { numeric: true });
        case "NAME_AZ":
          return a.name.localeCompare(b.name);
        case "TASKS_DESC":
          return b.activeTasksCount - a.activeTasksCount;
        case "PROJECTS_DESC":
          return b.totalProjectsCount - a.totalProjectsCount;
        default:
          return 0;
      }
    });

    return list;
  }, [employees, search, roleFilter, statusFilter, workloadFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    workloadFilter !== "ALL" ||
    sortBy !== "ID_ASC";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setWorkloadFilter("ALL");
    setSortBy("ID_ASC");
  };

  // Status Badge Token helper (§4/§6)
  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Active
          </span>
        );
      case AccountStatus.INACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F2F4F7] text-[#667085] border border-[#E4E7EC]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#98A2B3]" />
            Inactive
          </span>
        );
      case AccountStatus.SUSPENDED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Suspended
          </span>
        );
    }
  };

  // Role Badge Token helper (§4)
  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case SystemRole.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
            <Shield className="size-3" />
            Admin
          </span>
        );
      case SystemRole.PROJECT_LEAD:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Star className="size-3" />
            Project Lead
          </span>
        );
      case SystemRole.EMPLOYEE:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC]">
            Employee
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Attention Metrics Strip (§9: 4 cards, flat border, zero resting shadow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter("ALL");
            setStatusFilter("ALL");
            setWorkloadFilter("ALL");
          }}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            roleFilter === "ALL" && statusFilter === "ALL" && workloadFilter === "ALL" && !search
              ? "ring-1 ring-[#5B5FEF] border-[#D0D5DD] bg-white"
              : "bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Users className="size-3.5 text-[#5B5FEF]" />
              Total Personnel
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.total}
            </span>
            <span className="text-[11px] text-[#667085]">registered</span>
          </div>
        </button>

        {/* Active Staff */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === AccountStatus.ACTIVE ? "ALL" : AccountStatus.ACTIVE)}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            statusFilter === AccountStatus.ACTIVE
              ? "ring-2 ring-[#16A34A] border-[#16A34A] bg-[#F0FDF4]/50"
              : "bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-[#16A34A]" />
              Active Staff
            </span>
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#15803D]">
              {metrics.active}
            </span>
            <span className="text-[11px] text-[#667085]">in good standing</span>
          </div>
        </button>

        {/* Leads & Admins */}
        <button
          type="button"
          onClick={() =>
            setRoleFilter(
              roleFilter === SystemRole.PROJECT_LEAD ? "ALL" : SystemRole.PROJECT_LEAD
            )
          }
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            roleFilter === SystemRole.PROJECT_LEAD || roleFilter === SystemRole.ADMIN
              ? "ring-2 ring-[#5B5FEF] border-[#5B5FEF] bg-[#EFF6FF]"
              : "bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Shield className="size-3.5 text-[#5B5FEF]" />
              Leads & Admins
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.leadsAndAdmins}
            </span>
            <span className="text-[11px] text-[#667085]">leadership</span>
          </div>
        </button>

        {/* Available for Assignment */}
        <button
          type="button"
          onClick={() => setWorkloadFilter(workloadFilter === "AVAILABLE" ? "ALL" : "AVAILABLE")}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            workloadFilter === "AVAILABLE"
              ? "ring-2 ring-[#2563EB] border-[#2563EB] bg-[#EFF6FF]"
              : "bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-[#2563EB]" />
              Available Staff
            </span>
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#2563EB]">
              {metrics.available}
            </span>
            <span className="text-[11px] text-[#667085]">≤1 active task</span>
          </div>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#E4E7EC] rounded-[8px] p-3 sm:p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search by name, employee ID, position, email, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[#D0D5DD] bg-white text-[13px] text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF] focus:border-[#5B5FEF]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-[#98A2B3] hover:text-[#475467]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
              aria-label="Filter by role"
            >
              <option value="ALL">All Roles</option>
              <option value={SystemRole.ADMIN}>Admin</option>
              <option value={SystemRole.PROJECT_LEAD}>Project Lead</option>
              <option value={SystemRole.EMPLOYEE}>Employee</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
              aria-label="Filter by account status"
            >
              <option value="ALL">All Statuses</option>
              <option value={AccountStatus.ACTIVE}>Active</option>
              <option value={AccountStatus.INACTIVE}>Inactive</option>
              <option value={AccountStatus.SUSPENDED}>Suspended</option>
            </select>

            {/* Workload Filter */}
            <select
              value={workloadFilter}
              onChange={(e) => setWorkloadFilter(e.target.value as WorkloadFilter)}
              className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
              aria-label="Filter by workload"
            >
              <option value="ALL">All Workloads</option>
              <option value="ASSIGNED">With Assigned Projects</option>
              <option value="AVAILABLE">Available (≤1 active)</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 px-2.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-medium text-[#475467] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
              aria-label="Sort directory"
            >
              <option value="ID_ASC">Employee ID (Asc)</option>
              <option value="ID_DESC">Employee ID (Desc)</option>
              <option value="NAME_AZ">Name (A-Z)</option>
              <option value="TASKS_DESC">Active Tasks (Highest)</option>
              <option value="PROJECTS_DESC">Projects (Highest)</option>
            </select>

            {/* Reset Button */}
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
      </div>

      {/* 3. Team Directory Table (§14 Architecture) */}
      <div className="bg-white border border-[#E4E7EC] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-[#E4E7EC] bg-[#F9FAFB] text-[11px] uppercase tracking-wider font-semibold text-[#475467]">
              <tr>
                <th scope="col" className="px-4 py-3 min-w-[220px]">
                  Employee
                </th>
                <th scope="col" className="px-4 py-3 min-w-[170px]">
                  Position / System Role
                </th>
                <th scope="col" className="px-4 py-3 min-w-[190px]">
                  Projects
                </th>
                <th scope="col" className="px-4 py-3 min-w-[140px]">
                  Active Workload
                </th>
                <th scope="col" className="px-4 py-3 min-w-[110px]">
                  Status
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3 text-right min-w-[130px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1F5]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-4 py-16 text-center text-[#667085]"
                  >
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-[14px] font-semibold text-[#101828]">
                        No employees found
                      </p>
                      <p className="text-[12px] text-[#667085]">
                        {hasActiveFilters
                          ? "No team members match your current filters. Try changing or clearing your search criteria."
                          : "No personnel currently recorded in the team directory."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5B5FEF] text-white rounded-[6px] text-[12px] font-semibold hover:bg-[#4C50D8]"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const initials = emp.name
                    ? emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : emp.employeeId.slice(0, 2);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#F9FAFC] transition-colors group"
                    >
                      {/* Employee Identity */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[#5B5FEF] font-bold text-[12px] border border-[#E0E7FF]">
                              {initials}
                            </span>
                            <span
                              className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white ${
                                emp.accountStatus === AccountStatus.ACTIVE
                                  ? "bg-[#16A34A]"
                                  : emp.accountStatus === AccountStatus.SUSPENDED
                                  ? "bg-[#DC2626]"
                                  : "bg-[#98A2B3]"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/team/${emp.employeeId}`}
                                className="font-semibold text-[13px] text-[#101828] hover:text-[#5B5FEF] hover:underline truncate"
                              >
                                {emp.name}
                              </Link>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC]">
                                {emp.employeeId}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#667085] truncate mt-0.5">
                              {emp.email || "No email registered"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Position & Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-[#101828]">
                            {emp.position || "Staff Member"}
                          </p>
                          <div>{getRoleBadge(emp.systemRole)}</div>
                        </div>
                      </td>

                      {/* Assigned Projects */}
                      <td className="px-4 py-3">
                        {emp.projectMemberships.length === 0 && emp.projectsLed.length === 0 ? (
                          <span className="text-[11px] text-[#98A2B3]">
                            Unassigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {/* Projects Led */}
                            {emp.projectsLed.map((p) => (
                              <Link
                                key={`led-${p.id}`}
                                href={`/projects/${p.id}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
                                title={`Leads ${p.name}`}
                              >
                                <Star className="size-2.5 fill-[#2563EB]" />
                                {p.projectCode}
                              </Link>
                            ))}

                            {/* Member Projects (excluding ones already shown as led) */}
                            {emp.projectMemberships
                              .filter((pm) => !emp.projectsLed.some((pl) => pl.id === pm.project.id))
                              .slice(0, 3)
                              .map((pm) => (
                                <Link
                                  key={`mem-${pm.id}`}
                                  href={`/projects/${pm.project.id}`}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC] hover:bg-[#E4E7EC] transition-colors"
                                  title={`${pm.project.name} (${pm.projectRole})`}
                                >
                                  {pm.project.projectCode}
                                </Link>
                              ))}

                            {emp.projectMemberships.length > 3 && (
                              <span
                                className="text-[10px] font-bold text-[#667085] px-1 py-0.5 bg-[#F2F4F7] rounded"
                                title="Additional projects"
                              >
                                +{emp.projectMemberships.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active Workload (§14: Never present task count as a performance score) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-bold text-[#101828]">
                              {emp.activeTasksCount} active
                            </span>
                            {emp.blockedTasksCount > 0 && (
                              <span className="inline-flex items-center px-1 py-0.2 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                                {emp.blockedTasksCount} blocked
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#667085]">
                            {emp.totalTasksAssigned} historic deliverables
                          </div>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(emp.accountStatus)}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password Button */}
                            <ResetPasswordDialog
                              employee={{
                                id: emp.id,
                                employeeId: emp.employeeId,
                                name: emp.name,
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#7C3AED] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] transition-colors"
                                  title="Reset temporary password"
                                >
                                  <KeyRound className="size-3.5" />
                                </button>
                              }
                            />

                            {/* Status Dialog Button */}
                            <StatusDialog
                              employee={{
                                id: emp.id,
                                employeeId: emp.employeeId,
                                name: emp.name,
                                accountStatus: emp.accountStatus,
                              }}
                              trigger={
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#2563EB] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors"
                                  title="Change employee status"
                                >
                                  <UserX className="size-3.5" />
                                </button>
                              }
                            />

                            {/* Profile Link */}
                            <Link
                              href={`/team/${emp.employeeId}`}
                              className="inline-flex items-center justify-center size-7 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#5B5FEF] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] transition-colors"
                              title="View full profile"
                            >
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
