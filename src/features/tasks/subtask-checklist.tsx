'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { createSubtaskAction, toggleSubtaskAction, deleteSubtaskAction } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Check, Trash2, Loader2, CheckSquare } from 'lucide-react';

interface SubtaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: Date | null;
}

interface SubtaskChecklistProps {
  taskId: string;
  subtasks: SubtaskItem[];
  canEdit: boolean;
}

export function SubtaskChecklist({ taskId, subtasks, canEdit }: SubtaskChecklistProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startTransition(async () => {
      await createSubtaskAction(taskId, newTitle);
      setNewTitle('');
    });
  };

  const handleToggle = (subtaskId: string) => {
    if (!canEdit) return;
    startTransition(async () => {
      await toggleSubtaskAction(subtaskId);
    });
  };

  const handleDelete = (subtaskId: string) => {
    if (!canEdit) return;
    startTransition(async () => {
      await deleteSubtaskAction(subtaskId);
    });
  };

  const completedCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-text-primary flex items-center gap-1.5">
          <CheckSquare className="size-4 text-primary" /> Checklist & Subtasks
        </span>
        <span className="text-text-muted">
          {completedCount} of {subtasks.length} completed
        </span>
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${Math.round((completedCount / subtasks.length) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-1.5 pt-1">
        {subtasks.map((st) => (
          <div
            key={st.id}
            className={`group flex items-center justify-between p-2 rounded-md border transition-colors ${
              st.isCompleted
                ? 'bg-surface-secondary/40 border-border/60 text-text-muted'
                : 'bg-surface border-border text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => handleToggle(st.id)}
                disabled={!canEdit || isPending}
                className={`size-4 rounded-sm border flex items-center justify-center transition-colors ${
                  st.isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border bg-surface hover:border-primary'
                }`}
                aria-label={`Toggle subtask "${st.title}"`}
              >
                {st.isCompleted && <Check className="size-3 stroke-[3]" />}
              </button>
              <span
                className={`text-xs truncate ${
                  st.isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
                }`}
              >
                {st.title}
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => handleDelete(st.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-red-600 rounded"
                title="Delete subtask"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add New Subtask Form */}
      {canEdit && (
        <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a checklist step..."
            disabled={isPending}
            className="h-8 text-xs flex-1"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={!newTitle.trim() || isPending}
            className="h-8 px-2.5 text-xs font-semibold"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1 size-3.5" /> Add
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
