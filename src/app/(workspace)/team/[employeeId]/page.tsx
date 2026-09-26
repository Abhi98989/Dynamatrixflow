import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResetPasswordDialog } from "@/features/employees/reset-password-dialog";
import { StatusDialog } from "@/features/employees/status-dialog";
import {
  User,
  Mail,
  Briefcase,
  Shield,
  Calendar,
  FolderKanban,
  CheckSquare,
  ArrowLeft,
} from "lucide-react";
import { SystemRole, AccountStatus } from "@prisma/client";

interface PageProps {
  params: Promise<{ employeeId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { employeeId } = await params;
  const employee = await db.user.findUnique({
    where: { employeeId },
    select: { name: true, employeeId: true },
  });

  if (!employee) {
    return { title: "Employee Not Found | Dynamatrix Flow" };
  }

  return {
    title: `${employee.name} (${employee.employeeId}) | Dynamatrix Flow`,
  };
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;
  const { employeeId } = await params;

  const employee = await db.user.findUnique({
    where: { employeeId },
    include: {
      createdBy: {
        select: {
          name: true,
          employeeId: true,
        },
      },
      projectMemberships: {
        include: {
          project: true,
        },
        orderBy: {
          joinedAt: "desc",
        },
      },
      tasksAssigned: {
        include: {
          project: {
            select: {
              id: true,
              projectCode: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return (
          <span className="inline-flex items-center rounded-sm bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
            Active Account
          </span>
        );
      case AccountStatus.INACTIVE:
        return (
          <span className="inline-flex items-center rounded-sm bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400">
            Inactive
          </span>
        );
      case AccountStatus.SUSPENDED:
        return (
          <span className="inline-flex items-center rounded-sm bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            Suspended
          </span>
        );
    }
  };

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case SystemRole.ADMIN:
        return (
          <span className="inline-flex items-center rounded-sm bg-purple-50 px-2.5 py-1 text-xs font-semibold text-primary border border-purple-200">
            Leader / Admin
          </span>
        );
      case SystemRole.PROJECT_LEAD:
        return (
          <span className="inline-flex items-center rounded-sm bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            Project Lead
          </span>
        );
      case SystemRole.EMPLOYEE:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary border border-border">
            Employee
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Team Directory
        </Link>
      </div>

      {/* Profile Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-2xl border border-primary/20">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {employee.name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary border border-border">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              {employee.position || "Staff Member"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {getRoleBadge(employee.systemRole)}
              {getStatusBadge(employee.accountStatus)}
              {employee.mustChangePassword && (
                <span className="inline-flex items-center rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                  Password Change Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admin Management Tools */}
        {isAdmin && (
          <div className="flex items-center gap-2.5 pt-2 md:pt-0">
            <ResetPasswordDialog employee={employee} />
            <StatusDialog employee={employee} />
          </div>
        )}
      </div>

      {/* Grid: Details & Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Details */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div>
                <p className="text-xs text-text-muted">Corporate Email</p>
                <p className="font-medium text-text-primary mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-text-muted" />
                  {employee.email || "No email provided"}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-muted">Position / Title</p>
                <p className="font-medium text-text-primary mt-0.5 flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-text-muted" />
                  {employee.position || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-muted">System Permission</p>
                <p className="font-medium text-text-primary mt-0.5 flex items-center gap-1.5">
                  <Shield className="size-3.5 text-text-muted" />
                  {employee.systemRole}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-muted">Account Registered</p>
                <p className="font-medium text-text-primary mt-0.5 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-text-muted" />
                  {new Date(employee.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {employee.createdBy && (
                <div>
                  <p className="text-xs text-text-muted">Created By</p>
                  <p className="font-medium text-text-primary mt-0.5">
                    {employee.createdBy.name} ({employee.createdBy.employeeId})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Projects & Tasks */}
        <div className="space-y-6 md:col-span-2">
          {/* Projects */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderKanban className="size-4 text-primary" /> Project
                Memberships
              </CardTitle>
              <span className="text-xs font-semibold text-text-secondary">
                {employee.projectMemberships.length} Active
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {employee.projectMemberships.length === 0 ? (
                <p className="text-sm text-text-muted py-3">
                  This employee is not currently assigned to any projects.
                </p>
              ) : (
                <div className="space-y-3">
                  {employee.projectMemberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:bg-surface-secondary/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${membership.projectId}`}
                            className="font-semibold text-sm text-text-primary hover:text-primary transition-colors"
                          >
                            {membership.project.name}
                          </Link>
                          <span className="font-mono text-xs text-text-muted">
                            [{membership.project.projectCode}]
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Role:{" "}
                          <span className="font-medium text-text-primary">
                            {membership.projectRole}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs text-text-secondary">
                        Joined{" "}
                        {new Date(membership.joinedAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Tasks */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="size-4 text-primary" /> Assigned Work &
                Tasks
              </CardTitle>
              <span className="text-xs font-semibold text-text-secondary">
                {employee.tasksAssigned.length} Tasks
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              {employee.tasksAssigned.length === 0 ? (
                <p className="text-sm text-text-muted py-3">
                  No active tasks assigned yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {employee.tasksAssigned.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:bg-surface-secondary/40 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-text-muted">
                            {task.taskCode}
                          </span>
                          <p className="font-medium text-sm text-text-primary truncate">
                            {task.title}
                          </p>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Project: {task.project.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded px-2 py-0.5 text-xs font-semibold bg-surface-secondary border border-border">
                          {task.status}
                        </span>
                        <span className="rounded px-2 py-0.5 text-xs font-medium bg-surface-secondary border border-border">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
