"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { EditMilestoneDialog } from "./edit-milestone-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Settings2, Clock } from "lucide-react";
import { MilestoneStatus, TaskStatus, Priority } from "@prisma/client";

export interface MilestoneCardProps {
  milestone: {
    id: string;
    milestoneCode: string;
    name: string;
    description: string | null;
    status: MilestoneStatus;
    startDate: Date | null;
    deadline: Date | null;
    progressOverride: number | null;
    tasks: {
      id: string;
      taskCode: string;
      title: string;
      status: TaskStatus;
      priority: Priority;
      progress: number;
      assignee: {
        id: string;
        name: string;
        employeeId: string;
      } | null;
    }[];
  };
  projectId: string;
  isManager: boolean;
}

export function MilestoneCard({
  milestone,
  projectId,
  isManager,
}: MilestoneCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  // Compute progress: completed / total tasks, or override
  const totalTasks = milestone.tasks.length;
  const completedTasks = milestone.tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED,
  ).length;
  const calculatedProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressPercent =
    milestone.progressOverride !== null &&
    milestone.progressOverride !== undefined
      ? milestone.progressOverride
      : calculatedProgress;

  const isOverdue =
    milestone.deadline &&
    milestone.status !== MilestoneStatus.COMPLETED &&
    new Date(milestone.deadline) < new Date();

  const getStatusBadge = (st: MilestoneStatus) => {
    switch (st) {
      case MilestoneStatus.PLANNED:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2 py-0.5 text-xs font-semibold text-text-secondary border border-border">
            Planned
          </span>
        );
      case MilestoneStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
            In Progress
          </span>
        );
      case MilestoneStatus.COMPLETED:
        return (
          <span className="inline-flex items-center rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            Completed
          </span>
        );
      case MilestoneStatus.ON_HOLD:
        return (
          <span className="inline-flex items-center rounded-sm bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
            On Hold
          </span>
        );
    }
  };

  return (
    <>
      <Card className="p-5.5 border border-[rgba(220,227,240,0.9)] bg-surface shadow-clay space-y-4 rounded-[20px]">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              {milestone.milestoneCode}
            </span>
            <h3 className="text-base font-bold text-text-primary">
              {milestone.name}
            </h3>
            {getStatusBadge(milestone.status)}
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="h-8 text-xs font-semibold"
              >
                <Settings2 className="mr-1.5 size-3.5" /> Configure
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {milestone.description && (
          <p className="text-xs text-text-secondary leading-relaxed">
            {milestone.description}
          </p>
        )}

        {/* Progress & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Progress Column */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted font-medium">
                Deliverables Delivery
              </span>
              <span className="font-bold text-text-primary">
                {progressPercent}% ({completedTasks}/{totalTasks} tasks)
              </span>
            </div>
            <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent === 100 ? "bg-emerald-600" : "bg-primary"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Dates Column */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted sm:justify-end">
            {milestone.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-text-muted" /> Start:{" "}
                <strong className="text-text-primary font-medium">
                  {new Date(milestone.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </strong>
              </span>
            )}
            {milestone.deadline && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue ? "text-red-600 font-bold" : ""
                }`}
              >
                <Clock className="size-3.5" /> Due:{" "}
                <strong
                  className={
                    isOverdue ? "text-red-600" : "text-text-primary font-medium"
                  }
                >
                  {new Date(milestone.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </strong>
                {isOverdue && (
                  <span className="rounded bg-red-100 text-red-800 px-1 py-0.2 text-[10px]">
                    Overdue
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Linked Tasks Preview */}
        {milestone.tasks.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Linked Deliverables ({milestone.tasks.length})
            </p>
            <div className="space-y-1.5">
              {milestone.tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-md border border-border bg-surface-secondary/20 hover:bg-surface-secondary/50 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-text-secondary">
                      {t.taskCode}
                    </span>
                    <Link
                      href={`/projects/${projectId}/tasks/${t.id}`}
                      className="font-medium text-text-primary hover:text-primary transition-colors truncate"
                    >
                      {t.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.assignee && (
                      <span className="text-[11px] text-text-muted hidden sm:inline">
                        {t.assignee.name}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        t.status === TaskStatus.COMPLETED
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : t.status === TaskStatus.IN_REVIEW
                            ? "bg-purple-100 text-purple-800"
                            : t.status === TaskStatus.BLOCKED
                              ? "bg-red-100 text-red-800"
                              : "bg-surface-secondary text-text-secondary"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Edit Milestone Dialog */}
      <EditMilestoneDialog
        milestone={milestone}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
