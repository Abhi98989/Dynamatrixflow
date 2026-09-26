import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { EmployeeList, EmployeeItem } from "@/features/employees/employee-list";
import { AddEmployeeDialog } from "@/features/employees/add-employee-dialog";
import { SystemRole, TaskStatus } from "@prisma/client";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Team Directory | Dynamatrix Flow",
  description:
    "Manage staff, view employee roles, project assignments, and access levels.",
};

export default async function TeamPage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  const rawEmployees = await db.user.findMany({
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      position: true,
      systemRole: true,
      accountStatus: true,
      createdAt: true,
      lastLoginAt: true,
      projectMemberships: {
        where: { removedAt: null },
        select: {
          id: true,
          projectRole: true,
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              status: true,
            },
          },
        },
      },
      projectsLed: {
        where: { archivedAt: null },
        select: {
          id: true,
          name: true,
          projectCode: true,
        },
      },
      tasksAssigned: {
        where: {
          archivedAt: null,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
        select: {
          id: true,
          status: true,
          priority: true,
        },
      },
      _count: {
        select: {
          projectMemberships: { where: { removedAt: null } },
          tasksAssigned: { where: { archivedAt: null } },
        },
      },
    },
    orderBy: {
      employeeId: "asc",
    },
  });

  const employees: EmployeeItem[] = rawEmployees.map((emp) => {
    const activeTasks = emp.tasksAssigned;
    const blockedCount = activeTasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
    const inProgressCount = activeTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

    return {
      id: emp.id,
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      position: emp.position,
      systemRole: emp.systemRole,
      accountStatus: emp.accountStatus,
      createdAt: emp.createdAt.toISOString(),
      lastLoginAt: emp.lastLoginAt ? emp.lastLoginAt.toISOString() : null,
      projectMemberships: emp.projectMemberships.map((pm) => ({
        id: pm.id,
        projectRole: pm.projectRole,
        project: {
          id: pm.project.id,
          name: pm.project.name,
          projectCode: pm.project.projectCode,
          status: pm.project.status,
        },
      })),
      projectsLed: emp.projectsLed.map((pl) => ({
        id: pl.id,
        name: pl.name,
        projectCode: pl.projectCode,
      })),
      activeTasksCount: activeTasks.length,
      blockedTasksCount: blockedCount,
      inProgressTasksCount: inProgressCount,
      totalTasksAssigned: emp._count.tasksAssigned,
      totalProjectsCount: emp.projectMemberships.length + emp.projectsLed.length,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E4E7EC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-[#101828] flex items-center gap-2">
              <Users className="size-5 text-[#5B5FEF]" />
              Team Directory
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {employees.length} {employees.length === 1 ? "Member" : "Members"}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#475467]">
            Internal personnel roster, project staffing allocations, system roles, and active workload visibility.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <AddEmployeeDialog />
          </div>
        )}
      </div>

      {/* Employee List with Search, Filter & Management Actions */}
      <EmployeeList employees={employees} isAdmin={isAdmin} />
    </div>
  );
}
