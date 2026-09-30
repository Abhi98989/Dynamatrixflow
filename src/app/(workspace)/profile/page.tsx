import { Metadata } from "next";
import { requireActiveUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";
import { ProfileForm } from "@/features/employees/profile-form";
import {
  User,
  Shield,
  Calendar,
  FolderKanban,
  CheckSquare,
  Layers,
} from "lucide-react";
import { TaskStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Account Profile | Dynamatrix Flow",
  description:
    "Manage your corporate staff profile details and account security credentials.",
};

export default async function ProfilePage() {
  const currentUser = await requireActiveUser();

  const user = await db.user.findUniqueOrThrow({
    where: { id: currentUser.id },
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
      _count: {
        select: {
          projectMemberships: { where: { removedAt: null } },
          tasksAssigned: { where: { archivedAt: null } },
        },
      },
      tasksAssigned: {
        where: {
          archivedAt: null,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
        select: { id: true },
      },
    },
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.employeeId.slice(0, 2);

  const activeTasksCount = user.tasksAssigned.length;
  const totalProjectsCount = user._count.projectMemberships;
  const totalHistoricTasks = user._count.tasksAssigned;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="border-b border-border pb-5">
        <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground flex items-center gap-2">
          <User className="size-5 text-primary" />
          Account Profile
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Corporate identity profile, workspace permissions, and account
          credentials.
        </p>
      </div>

      {/* 2. Identity Summary Card (§0: 0 shadow, 8px radius, flat 1px border) */}
      <div className="bg-surface rounded-[8px] border border-border p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#EEF2FF] text-primary font-bold text-[18px] border border-[#E0E7FF]">
              {initials}
            </span>
            <span className="absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-white bg-[#16A34A]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold text-foreground">
                {user.name}
              </h2>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-hover text-text-secondary border border-border">
                {user.employeeId}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                <Shield className="size-3" />
                {user.systemRole}
              </span>
            </div>

            <p className="text-[13px] text-text-muted flex flex-wrap items-center gap-2">
              <span>{user.position || "Corporate Staff"}</span>
              <span>•</span>
              <span>{user.email || "No email assigned"}</span>
            </p>
          </div>
        </div>

        {/* Workload Stats */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-6 shrink-0">
          <div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <FolderKanban className="size-3 text-primary" />
              Projects
            </div>
            <p className="text-[18px] font-bold text-foreground mt-0.5">
              {totalProjectsCount}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <CheckSquare className="size-3 text-[#16A34A]" />
              Active Tasks
            </div>
            <p className="text-[18px] font-bold text-foreground mt-0.5">
              {activeTasksCount}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <Layers className="size-3 text-primary" />
              Total Delivered
            </div>
            <p className="text-[18px] font-bold text-foreground mt-0.5">
              {totalHistoricTasks}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[11px] text-text-muted">
              <Calendar className="size-3 text-text-muted" />
              Joined
            </div>
            <p className="text-[13px] font-medium text-text-secondary mt-1">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Forms Section */}
      <ProfileForm user={user} />
    </div>
  );
}
