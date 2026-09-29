'use client';

import * as React from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  BookOpen, 
  UserPlus, 
  UserMinus, 
  MessageSquare,
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
  Activity,
  UserRound
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils/date';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string | null;
    employeeId: string;
  } | null;
}

export function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border rounded-xl bg-surface-secondary/30">
        <Activity className="size-8 text-text-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium text-text-primary">No activity yet</p>
        <p className="text-xs text-text-secondary mt-1">Actions taken in this project will appear here.</p>
      </div>
    );
  }

  const getActionDetails = (log: ActivityLog) => {
    switch (log.action) {
      case 'CREATED_PROJECT':
      case 'PROJECT_CREATED':
        return { icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'created the project' };
      case 'ADDED_MEMBER':
      case 'PROJECT_MEMBER_ADDED':
        return { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: `added ${typeof log.metadata?.targetUserName === 'string' ? log.metadata.targetUserName : typeof log.metadata?.memberRole === 'string' ? log.metadata.memberRole : 'a member'}` };
      case 'REMOVED_MEMBER':
      case 'PROJECT_MEMBER_REMOVED':
        return { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: `removed ${typeof log.metadata?.targetUserName === 'string' ? log.metadata.targetUserName : 'a member'}` };
      case 'CREATED_TASK':
      case 'TASK_CREATED': {
        const taskTitle = typeof log.metadata?.title === 'string' ? ` - ${log.metadata.title}` : '';
        return { icon: CheckSquare, color: 'text-primary', bg: 'bg-primary/10', text: `created task ${typeof log.metadata?.taskCode === 'string' ? log.metadata.taskCode : ''}${taskTitle}` };
      }
      case 'UPDATED_TASK_STATUS':
      case 'TASK_STATUS_CHANGED': {
        const newStatus = typeof log.metadata?.newStatus === 'string' ? log.metadata.newStatus.replace(/_/g, ' ') : 'a new status';
        const taskCode = typeof log.metadata?.taskCode === 'string' ? log.metadata.taskCode : '';
        return { icon: Edit2, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: `moved task ${taskCode} to ${newStatus}` };
      }
      case 'REQUESTED_REVIEW':
      case 'TASK_SUBMITTED_FOR_REVIEW':
        return { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: `requested review for task ${typeof log.metadata?.taskCode === 'string' ? log.metadata.taskCode : ''}` };
      case 'APPROVED_REVIEW':
      case 'TASK_REVIEW_APPROVED':
        return { icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: `approved task ${typeof log.metadata?.taskCode === 'string' ? log.metadata.taskCode : ''}` };
      case 'CREATED_COMMENT':
      case 'TASK_COMMENT_CREATED': {
        const taskCode = typeof log.metadata?.taskCode === 'string' ? ` [${log.metadata.taskCode}]` : '';
        return { icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: `commented on task${taskCode}` };
      }
      case 'GUEST_ACCESS_GRANTED':
        return { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: `granted guest access to ${typeof log.metadata?.name === 'string' ? log.metadata.name : 'a guest'}` };
      case 'GUEST_ACCESS_REVOKED':
        return { icon: UserMinus, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: `revoked guest access for ${typeof log.metadata?.name === 'string' ? log.metadata.name : 'a guest'}` };
      case 'CREATED_RESOURCE':
      case 'RESOURCE_CREATED':
        return { icon: BookOpen, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', text: `added resource "${typeof log.metadata?.title === 'string' ? log.metadata.title : 'link'}"` };
      case 'UPDATED_RESOURCE':
      case 'RESOURCE_UPDATED':
        return { icon: Edit2, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', text: `updated resource "${typeof log.metadata?.title === 'string' ? log.metadata.title : 'link'}"` };
      case 'ARCHIVED_RESOURCE':
      case 'RESOURCE_ARCHIVED':
        return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: `archived resource "${typeof log.metadata?.title === 'string' ? log.metadata.title : 'link'}"` };
      default:
        return { icon: Activity, color: 'text-text-muted', bg: 'bg-surface-secondary', text: log.action.replace(/_/g, ' ').toLowerCase() };
    }
  };

  return (
    <div className="relative border-l border-border ml-3 sm:ml-4 space-y-6 pb-6">
      {logs.map((log) => {
        const details = getActionDetails(log);
        const Icon = details.icon;

        return (
          <div key={log.id} className="relative pl-6 sm:pl-8 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[1.1rem] sm:-left-[1.125rem] p-1.5 rounded-full border-2 border-surface ${details.bg} ${details.color} ring-1 ring-border group-hover:ring-primary/50 transition-all z-10`}>
              <Icon className="size-3.5" />
            </div>

            <div className="bg-surface border border-border rounded-xl p-3 sm:p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-review-bg text-primary flex items-center justify-center shrink-0">
                    <UserRound className="size-3.5" />
                  </div>
                  <div className="text-sm text-text-primary">
                    <span className="font-semibold">{log.actor?.name || log.actor?.employeeId || 'Unknown'}</span>
                    <span className="text-text-secondary mx-1">{details.text}</span>
                  </div>
                </div>
                <div className="text-[11px] text-text-muted whitespace-nowrap pl-8 sm:pl-0">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              {/* Optional extended metadata display */}
              {((log.action === 'CREATED_COMMENT' || log.action === 'TASK_COMMENT_CREATED') && log.metadata && typeof log.metadata === 'object' && ('content' in log.metadata || 'commentPreview' in log.metadata)) && (
                <div className="mt-2 pl-8 border-l-2 border-border/50 ml-3">
                  <p className="text-xs text-text-secondary italic line-clamp-2">&ldquo;{String(log.metadata.content || log.metadata.commentPreview)}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
