'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { createTaskCommentAction, deleteTaskCommentAction } from './actions';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface CommentItem {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  deletedAt: Date | null;
  user: {
    id: string;
    name: string;
    employeeId: string;
    position: string | null;
  };
}

interface TaskCommentsSectionProps {
  taskId: string;
  comments: CommentItem[];
  currentUserId: string;
  isLeadOrAdmin: boolean;
}

export function TaskCommentsSection({
  taskId,
  comments,
  currentUserId,
  isLeadOrAdmin,
}: TaskCommentsSectionProps) {
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeComments = comments.filter((c) => !c.deletedAt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!content.trim()) return;

    startTransition(async () => {
      const res = await createTaskCommentAction(taskId, content);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setContent('');
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteTaskCommentAction(commentId);
      if (res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-text-primary">
          <MessageSquare className="size-4 text-primary" /> Deliverable Discussion
        </h3>
        <span className="text-xs text-text-muted">
          {activeComments.length} {activeComments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800"
        >
          <AlertCircle className="size-3.5 shrink-0 text-red-600" />
          <p className="flex-1 font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Comments List */}
      {activeComments.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted italic bg-surface-secondary/30 rounded-lg border border-dashed border-border">
          No comments or review notes posted yet. Start the conversation below.
        </p>
      ) : (
        <div className="space-y-3">
          {activeComments.map((c) => {
            const isAuthor = c.userId === currentUserId;
            const canDelete = isAuthor || isLeadOrAdmin;

            return (
              <div
                key={c.id}
                className="group p-3.5 rounded-lg border border-border bg-surface text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-review-bg text-primary font-bold text-[10px]">
                      {c.user.name.charAt(0)}
                    </span>
                    <div>
                      <span className="font-semibold text-text-primary mr-1.5">
                        {c.user.name}
                      </span>
                      <span className="text-text-muted text-[11px]">
                        ({c.user.employeeId})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-text-muted text-[11px]">
                    <span>
                      {new Date(c.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-red-600 rounded"
                        title="Delete comment"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-text-secondary leading-relaxed whitespace-pre-wrap pl-8">
                  {c.content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Comment Box */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment, share review feedback, or update task progress..."
          rows={3}
          disabled={isPending}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted">
            Shift + Enter for new lines
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isPending}
            className="h-8 text-xs font-semibold"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 size-3.5" />
            )}
            Post Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
