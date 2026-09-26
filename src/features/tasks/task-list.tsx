'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TaskStatusDropdown } from './task-status-dropdown';
import {
  Search,
  Filter,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { TaskStatus, Priority } from '@prisma/client';

export interface TaskListItem {
  id: string;
  taskCode: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  startDate: Date | null;
  dueDate: Date | null;
  blockerReason: string | null;
  assignee: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
  project?: {
    id: string;
    name: string;
    projectCode: string;
  };
  _count?: {
    subtasks: number;
    comments: number;
  };
}

interface TaskListProps {
  tasks: TaskListItem[];
  currentUserId: string;
  isLeadOrAdmin: boolean;
  basePath?: string; // e.g. /projects/[id]/tasks or /my-tasks
}

export function TaskList({
  tasks,
  currentUserId,
  isLeadOrAdmin,
}: TaskListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'ALL';
  const priorityFilter = searchParams.get('priority') || 'ALL';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.taskCode.toLowerCase().includes(q) ||
        (t.assignee && t.assignee.name.toLowerCase().includes(q)) ||
        (t.project && t.project.name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const isOverdue = (dueDate: Date | null, status: TaskStatus) => {
    if (!dueDate) return false;
    if (status === TaskStatus.COMPLETED || status === TaskStatus.CANCELLED) return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return (
          <span className="inline-flex items-center rounded-sm bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            Critical
          </span>
        );
      case Priority.HIGH:
        return (
          <span className="inline-flex items-center rounded-sm bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200">
            High
          </span>
        );
      case Priority.MEDIUM:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary border border-border">
            Medium
          </span>
        );
      case Priority.LOW:
        return (
          <span className="inline-flex items-center rounded-sm bg-surface-secondary px-2 py-0.5 text-xs font-normal text-text-muted border border-border">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-text-muted" />
          <Input
            placeholder="Search tasks by title, code, or assignee..."
            value={search}
            onChange={(e) => updateParam('q', e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="size-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => updateParam('status', e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by task status"
          >
            <option value="ALL">All Statuses</option>
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.BLOCKED}>Blocked</option>
            <option value={TaskStatus.IN_REVIEW}>In Review</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.CANCELLED}>Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => updateParam('priority', e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter by task priority"
          >
            <option value="ALL">All Priorities</option>
            <option value={Priority.CRITICAL}>Critical</option>
            <option value={Priority.HIGH}>High</option>
            <option value={Priority.MEDIUM}>Medium</option>
            <option value={Priority.LOW}>Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      <Card className="overflow-hidden border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface-secondary/50 text-xs uppercase font-semibold text-text-secondary">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Task</th>
                  <th scope="col" className="px-4 py-3.5">Code</th>
                  <th scope="col" className="px-4 py-3.5">Priority</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Assignee</th>
                  <th scope="col" className="px-4 py-3.5">Due Date</th>
                  <th scope="col" className="px-4 py-3.5">Progress</th>
                  <th scope="col" className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-text-muted text-xs">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const overdue = isOverdue(t.dueDate, t.status);
                    const taskDetailUrl = `/projects/${t.projectId}/tasks/${t.id}`;
                    const isAssignee = t.assignee?.id === currentUserId;

                    return (
                      <tr key={t.id} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="min-w-[200px] max-w-md">
                            <Link
                              href={taskDetailUrl}
                              className="font-medium text-text-primary hover:text-primary transition-colors text-sm line-clamp-1"
                            >
                              {t.title}
                            </Link>
                            {t.project && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {t.project.name}
                              </p>
                            )}
                            {t.status === TaskStatus.BLOCKED && t.blockerReason && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                                <AlertCircle className="size-3 shrink-0" />
                                Blocker: {t.blockerReason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-secondary border border-border">
                            {t.taskCode}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">{getPriorityBadge(t.priority)}</td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <TaskStatusDropdown
                            taskId={t.id}
                            currentStatus={t.status}
                            currentProgress={t.progress}
                            blockerReason={t.blockerReason}
                            isLeadOrAdmin={isLeadOrAdmin}
                            isAssignee={isAssignee}
                          />
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {t.assignee ? (
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-[10px]">
                                {t.assignee.name.charAt(0)}
                              </span>
                              <span className="text-xs font-medium text-text-primary">
                                {t.assignee.name}
                                {isAssignee && ' (You)'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {t.dueDate ? (
                            <div
                              className={`text-xs flex items-center gap-1.5 ${
                                overdue ? 'text-red-600 font-semibold' : 'text-text-secondary'
                              }`}
                            >
                              <Calendar className="size-3.5" />
                              <span>
                                {new Date(t.dueDate).toLocaleDateString("en-US", {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {overdue && (
                                <span className="rounded bg-red-100 text-red-800 px-1 py-0.2 text-[10px]">
                                  Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-surface-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${t.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted w-7 text-right">
                              {t.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Link
                            href={taskDetailUrl}
                            className="inline-flex items-center justify-center size-7 rounded-md border border-border hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors"
                            title="View Task Details"
                          >
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
