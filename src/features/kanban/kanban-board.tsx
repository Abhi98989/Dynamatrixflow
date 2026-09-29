'use client';

import * as React from 'react';
import { useState, useMemo, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateTaskStatusAction, createTaskAction } from '@/features/tasks/actions';
import { TaskDrawer } from '@/features/tasks/task-drawer';
import { TaskStatus, Priority } from '@prisma/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  AlertCircle,
  CheckSquare,
  GripVertical,
  Loader2,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';

export interface KanbanTaskItem {
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
  milestone?: {
    id: string;
    milestoneCode: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
  _count?: {
    subtasks: number;
    comments: number;
  };
}

interface KanbanBoardProps {
  initialTasks: KanbanTaskItem[];
  projectId: string;
  currentUserId: string;
  isLeadOrAdmin: boolean;
  members: {
    userId: string;
    user: {
      id: string;
      name: string;
      employeeId: string;
    };
  }[];
}

const COLUMNS: { id: TaskStatus; label: string; headerColor: string }[] = [
  { id: TaskStatus.TODO, label: 'To Do', headerColor: 'border-t-zinc-400' },
  { id: TaskStatus.IN_PROGRESS, label: 'In Progress', headerColor: 'border-t-blue-500' },
  { id: TaskStatus.BLOCKED, label: 'Blocked', headerColor: 'border-t-red-500' },
  { id: TaskStatus.IN_REVIEW, label: 'In Review', headerColor: 'border-t-purple-500' },
  { id: TaskStatus.COMPLETED, label: 'Completed', headerColor: 'border-t-emerald-500' },
];

export function KanbanBoard({
  initialTasks,
  projectId,
  currentUserId,
  isLeadOrAdmin,
  members,
}: KanbanBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(searchParams?.get('task') || null);
  const [tasks, setTasks] = useState<KanbanTaskItem[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<KanbanTaskItem | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Blocker modal state
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [pendingBlockedTaskId, setPendingBlockedTaskId] = useState<string | null>(null);
  const [blockerReasonInput, setBlockerReasonInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.taskCode.toLowerCase().includes(q);

      const matchesAssignee =
        assigneeFilter === 'ALL' ||
        (assigneeFilter === 'UNASSIGNED' ? !t.assignee : t.assignee?.id === assigneeFilter);

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesAssignee && matchesPriority;
    });
  }, [tasks, search, assigneeFilter, priorityFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Check if transition is to BLOCKED -> open blocker reason dialog
    if (newStatus === TaskStatus.BLOCKED) {
      setPendingBlockedTaskId(taskId);
      setBlockerReasonInput(task.blockerReason || '');
      setBlockerModalOpen(true);
      return;
    }

    // Role guard: Assignee cannot complete task directly without Lead review
    if (newStatus === TaskStatus.COMPLETED && !isLeadOrAdmin) {
      setErrorMsg('Contributors cannot mark deliverables directly as Completed. Please drag to In Review for Project Lead approval.');
      return;
    }

    // Optimistically update
    const previousStatus = task.status;
    setErrorMsg(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const res = await updateTaskStatusAction(taskId, newStatus, task.progress);
      if (res.error) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
        );
        setErrorMsg(res.error);
      }
    });
  };

  const handleBlockerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBlockedTaskId) return;

    if (!blockerReasonInput.trim()) {
      setErrorMsg('Blocker reason is required.');
      return;
    }

    const taskId = pendingBlockedTaskId;
    const reason = blockerReasonInput.trim();
    const task = tasks.find((t) => t.id === taskId);
    const previousStatus = task?.status || TaskStatus.TODO;

    setBlockerModalOpen(false);
    setErrorMsg(null);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: TaskStatus.BLOCKED, blockerReason: reason }
          : t
      )
    );

    startTransition(async () => {
      const res = await updateTaskStatusAction(
        taskId,
        TaskStatus.BLOCKED,
        task?.progress || 0,
        reason
      );
      if (res.error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
        );
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alert banner for drag errors */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <p className="flex-1 font-medium">{errorMsg}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setErrorMsg(null)}
            className="h-6 text-[11px] px-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-text-muted" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} ({m.user.employeeId})
                </option>
              ))}
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Priorities</option>
            <option value={Priority.CRITICAL}>Critical</option>
            <option value={Priority.HIGH}>High</option>
            <option value={Priority.MEDIUM}>Medium</option>
            <option value={Priority.LOW}>Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={columnTasks}
                currentUserId={currentUserId}
                projectId={projectId}
                isLeadOrAdmin={isLeadOrAdmin}
                onSelectTask={(id) => setDrawerTaskId(id)}
                onTaskCreated={() => router.refresh()}
              />
            );
          })}
        </div>

        {/* Drag Overlay for active card preview */}
        <DragOverlay>
          {activeTask ? (
            <div className="w-64 opacity-90 shadow-xl pointer-events-none rotate-2">
              <KanbanCardItem
                task={activeTask}
                currentUserId={currentUserId}
                projectId={projectId}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Slide-Over Task Drawer */}
      <TaskDrawer
        taskId={drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        onTaskUpdated={() => router.refresh()}
      />

      {/* Blocker Reason Modal */}
      <Dialog open={blockerModalOpen} onOpenChange={setBlockerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="size-5" /> Mark Deliverable as Blocked
            </DialogTitle>
            <DialogDescription>
              Specify what is blocking this deliverable so leads and team members can help resolve it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBlockerSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="kanbanBlockerReason">Blocker Reason *</Label>
              <textarea
                id="kanbanBlockerReason"
                value={blockerReasonInput}
                onChange={(e) => setBlockerReasonInput(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Waiting on third-party API credentials from vendor..."
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Set Blocked
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanQuickAdd({
  columnId,
  projectId,
  onTaskCreated,
}: {
  columnId: TaskStatus;
  projectId: string;
  onTaskCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('projectId', projectId);
      formData.set('title', title.trim());
      formData.set('status', columnId);
      const res = await createTaskAction(undefined, formData);
      if (res.success) {
        setTitle('');
        setIsOpen(false);
        onTaskCreated();
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-border/80 text-text-muted hover:text-text-primary hover:border-primary/60 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors bg-surface/40 hover:bg-surface mt-1"
      >
        <Plus className="size-3" />
        Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-2.5 rounded-lg border border-border bg-surface shadow-xs space-y-2 mt-1">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task title..."
        className="w-full text-xs p-1.5 rounded border border-border focus:outline-none focus:border-primary bg-surface-secondary/40 text-text-primary"
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => { setIsOpen(false); setTitle(''); }}
          className="px-2 py-0.5 text-[11px] text-text-muted hover:text-text-primary font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isPending}
          className="px-2.5 py-1 text-[11px] bg-primary text-white rounded font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}

function KanbanColumn({
  column,
  tasks,
  currentUserId,
  projectId,
  isLeadOrAdmin,
  onSelectTask,
  onTaskCreated,
}: {
  column: { id: TaskStatus; label: string; headerColor: string };
  tasks: KanbanTaskItem[];
  currentUserId: string;
  projectId: string;
  isLeadOrAdmin: boolean;
  onSelectTask: (id: string) => void;
  onTaskCreated: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border border-border bg-surface-secondary/40 min-h-[500px] transition-colors ${
        column.headerColor
      } border-t-2 ${isOver ? 'bg-primary/5 border-primary/40' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/80 flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-primary tracking-tight">
          {column.label}
        </h4>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-text-secondary border border-border">
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="p-2 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {tasks.map((task) => (
            <DraggableKanbanCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              projectId={projectId}
              onSelectTask={onSelectTask}
            />
          ))}

          {tasks.length === 0 && (
            <div className="py-8 text-center text-[11px] text-text-muted italic">
              No deliverables
            </div>
          )}
        </div>

        {isLeadOrAdmin && (
          <KanbanQuickAdd
            columnId={column.id}
            projectId={projectId}
            onTaskCreated={onTaskCreated}
          />
        )}
      </div>
    </div>
  );
}

function DraggableKanbanCard({
  task,
  currentUserId,
  projectId,
  onSelectTask,
}: {
  task: KanbanTaskItem;
  currentUserId: string;
  projectId: string;
  onSelectTask: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'opacity-30' : 'opacity-100'}
    >
      <KanbanCardItem
        task={task}
        currentUserId={currentUserId}
        projectId={projectId}
        dragHandleProps={{ ...attributes, ...listeners }}
        onSelectTask={onSelectTask}
      />
    </div>
  );
}

function KanbanCardItem({
  task,
  currentUserId,
  dragHandleProps,
  isOverlay = false,
  onSelectTask,
}: {
  task: KanbanTaskItem;
  currentUserId: string;
  projectId?: string;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
  onSelectTask?: (id: string) => void;
}) {
  const isAssignee = task.assignee?.id === currentUserId;
  const isOverdue =
    task.dueDate &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.CANCELLED &&
    new Date(task.dueDate) < new Date();

  const getPriorityDot = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL:
        return 'bg-red-600 text-red-600';
      case Priority.HIGH:
        return 'bg-orange-500 text-orange-500';
      case Priority.MEDIUM:
        return 'bg-blue-500 text-blue-500';
      case Priority.LOW:
        return 'bg-zinc-400 text-zinc-400';
    }
  };

  return (
    <Card
      className={`p-3 rounded-lg border border-border bg-surface hover:shadow-xs transition-shadow space-y-2.5 text-xs ${
        isOverlay ? 'shadow-lg border-primary' : ''
      }`}
    >
      {/* Top Header: Code, Priority, Drag Handle */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
            {task.taskCode}
          </span>
          <span
            className={`size-2 rounded-full ${getPriorityDot(task.priority).split(' ')[0]}`}
            title={`Priority: ${task.priority}`}
          />
        </div>

        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
          title="Drag deliverable"
        >
          <GripVertical className="size-3.5" />
        </div>
      </div>

      {/* Task Title */}
      <button
        type="button"
        onClick={() => onSelectTask ? onSelectTask(task.id) : undefined}
        className="font-medium text-text-primary hover:text-primary transition-colors text-xs line-clamp-2 block leading-snug text-left cursor-pointer w-full"
      >
        {task.title}
      </button>

      {/* Blocker reason if present */}
      {task.status === TaskStatus.BLOCKED && task.blockerReason && (
        <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium bg-red-50 dark:bg-red-950/30 p-1.5 rounded border border-red-200/80">
          <AlertCircle className="size-3 shrink-0" />
          <span className="truncate">{task.blockerReason}</span>
        </p>
      )}

      {/* Milestone tag if present */}
      {task.milestone && (
        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200/60 max-w-full truncate">
          <Layers className="size-2.5 shrink-0" /> {task.milestone.name}
        </span>
      )}

      {/* Bottom Footer: Assignee, Checklist Count, Due Date */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-[11px] text-text-muted">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-[9px]">
              {task.assignee.name.charAt(0)}
            </span>
            <span
              className={`truncate max-w-[80px] ${
                isAssignee ? 'font-bold text-primary' : 'text-text-secondary'
              }`}
            >
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="italic text-[10px]">Unassigned</span>
        )}

        <div className="flex items-center gap-2">
          {task._count && task._count.subtasks > 0 && (
            <span className="flex items-center gap-0.5 text-text-muted" title="Checklist steps">
              <CheckSquare className="size-3" />
              {task._count.subtasks}
            </span>
          )}

          {task.dueDate && (
            <span
              className={`flex items-center gap-0.5 ${
                isOverdue ? 'text-red-600 font-bold' : 'text-text-muted'
              }`}
              title={new Date(task.dueDate).toLocaleDateString("en-US")}
            >
              <Clock className="size-3" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: 'numeric',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
