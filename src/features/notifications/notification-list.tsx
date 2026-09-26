'use client';

import * as React from 'react';
import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  BookOpen,
  Trash2,
  Search,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { NotificationType } from '@prisma/client';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
  clearAllReadNotificationsAction,
} from './actions';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  projectId: string | null;
  isRead: boolean;
  createdAt: string; // ISO string
}

interface NotificationListProps {
  initialNotifications: NotificationItem[];
}

type NotificationFilterTab = 'ALL' | 'UNREAD' | 'TASKS' | 'DEADLINES' | 'PROJECTS';

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Metric stats
  const metrics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const tasks = notifications.filter(
      (n) =>
        n.type === 'TASK_ASSIGNED' ||
        n.type === 'TASK_REASSIGNED' ||
        n.type === 'TASK_REVIEW_REQUESTED' ||
        n.type === 'TASK_REVIEWED' ||
        n.type === 'TASK_COMMENT'
    ).length;
    const deadlines = notifications.filter(
      (n) => n.type === 'TASK_DUE_SOON' || n.type === 'TASK_OVERDUE'
    ).length;

    return { total, unread, tasks, deadlines };
  }, [notifications]);

  // Actions
  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await deleteNotificationAction(id);
    });
  };

  const handleClearAllRead = () => {
    if (!confirm('Are you sure you want to clear all read notifications?')) return;
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    startTransition(async () => {
      await clearAllReadNotificationsAction();
    });
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'UNREAD' && n.isRead) return false;
      if (
        activeTab === 'TASKS' &&
        n.type !== 'TASK_ASSIGNED' &&
        n.type !== 'TASK_REASSIGNED' &&
        n.type !== 'TASK_REVIEW_REQUESTED' &&
        n.type !== 'TASK_REVIEWED' &&
        n.type !== 'TASK_COMMENT'
      ) {
        return false;
      }
      if (
        activeTab === 'DEADLINES' &&
        n.type !== 'TASK_DUE_SOON' &&
        n.type !== 'TASK_OVERDUE'
      ) {
        return false;
      }
      if (
        activeTab === 'PROJECTS' &&
        n.type !== 'PROJECT_ASSIGNED' &&
        n.type !== 'PROJECT_UPDATE' &&
        n.type !== 'RESOURCE_ADDED'
      ) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMsg = n.message.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      return true;
    });
  }, [notifications, activeTab, search]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'PROJECT_ASSIGNED':
      case 'PROJECT_UPDATE':
        return <FolderKanban className="size-4 text-[#2563EB]" />;
      case 'TASK_ASSIGNED':
      case 'TASK_REASSIGNED':
      case 'TASK_REVIEWED':
        return <CheckSquare className="size-4 text-[#16A34A]" />;
      case 'TASK_REVIEW_REQUESTED':
        return <AlertCircle className="size-4 text-[#EA580C]" />;
      case 'TASK_DUE_SOON':
      case 'TASK_OVERDUE':
        return <Clock className="size-4 text-[#DC2626]" />;
      case 'TASK_COMMENT':
        return <MessageSquare className="size-4 text-[#7C3AED]" />;
      case 'RESOURCE_ADDED':
        return <BookOpen className="size-4 text-[#0891B2]" />;
      default:
        return <Bell className="size-4 text-[#667085]" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'PROJECT_ASSIGNED':
      case 'PROJECT_UPDATE':
        return 'bg-[#EFF6FF] border-[#BFDBFE]';
      case 'TASK_ASSIGNED':
      case 'TASK_REASSIGNED':
      case 'TASK_REVIEWED':
        return 'bg-[#F0FDF4] border-[#BBF7D0]';
      case 'TASK_REVIEW_REQUESTED':
        return 'bg-[#FFF7ED] border-[#FED7AA]';
      case 'TASK_DUE_SOON':
      case 'TASK_OVERDUE':
        return 'bg-[#FEF2F2] border-[#FECACA]';
      case 'TASK_COMMENT':
        return 'bg-[#F5F3FF] border-[#DDD6FE]';
      case 'RESOURCE_ADDED':
        return 'bg-[#ECFEFF] border-[#A5F3FC]';
      default:
        return 'bg-[#F2F4F7] border-[#E4E7EC]';
    }
  };

  const getLink = (notif: NotificationItem) => {
    if (notif.projectId && notif.entityType === 'Task' && notif.entityId) {
      return `/projects/${notif.projectId}/tasks/${notif.entityId}`;
    }
    if (notif.projectId && notif.entityType === 'Project') {
      return `/projects/${notif.projectId}`;
    }
    if (notif.projectId && notif.entityType === 'RESOURCE') {
      return `/projects/${notif.projectId}/resources`;
    }
    if (notif.projectId) {
      return `/projects/${notif.projectId}`;
    }
    return null;
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Attention Metrics Strip (§9: 4 stat cards, zero resting shadow) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Notifications */}
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            activeTab === 'ALL' && !search
              ? 'ring-1 ring-[#5B5FEF] border-[#D0D5DD] bg-white'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Bell className="size-3.5 text-[#5B5FEF]" />
              Total Alerts
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.total}
            </span>
            <span className="text-[11px] text-[#667085]">logged</span>
          </div>
        </button>

        {/* Unread Alerts */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'UNREAD' ? 'ALL' : 'UNREAD')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            activeTab === 'UNREAD'
              ? 'ring-2 ring-[#5B5FEF] border-[#5B5FEF] bg-[#EFF6FF]'
              : metrics.unread > 0
              ? 'bg-[#EFF6FF]/40 border-[#BFDBFE] hover:bg-[#EFF6FF]/70'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Check className="size-3.5 text-[#5B5FEF]" />
              Unread
            </span>
            {metrics.unread > 0 && <span className="w-2 h-2 rounded-full bg-[#5B5FEF]" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-[22px] sm:text-[24px] font-bold tracking-tight ${
                metrics.unread > 0 ? 'text-[#5B5FEF]' : 'text-[#101828]'
              }`}
            >
              {metrics.unread}
            </span>
            <span className="text-[11px] text-[#667085]">pending review</span>
          </div>
        </button>

        {/* Deliverables / Tasks */}
        <button
          type="button"
          onClick={() => setActiveTab('TASKS')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            activeTab === 'TASKS'
              ? 'ring-2 ring-[#16A34A] border-[#16A34A] bg-[#F0FDF4]/50'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <CheckSquare className="size-3.5 text-[#16A34A]" />
              Deliverables & Reviews
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#101828]">
              {metrics.tasks}
            </span>
            <span className="text-[11px] text-[#667085]">work items</span>
          </div>
        </button>

        {/* Deadlines & Overdue */}
        <button
          type="button"
          onClick={() => setActiveTab('DEADLINES')}
          className={`p-3.5 sm:p-4 rounded-[8px] border text-left transition-all ${
            activeTab === 'DEADLINES'
              ? 'ring-2 ring-[#DC2626] border-[#DC2626] bg-[#FEF2F2]/60'
              : metrics.deadlines > 0
              ? 'bg-[#FEF2F2]/30 border-[#FECACA] hover:bg-[#FEF2F2]/60'
              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#475467] flex items-center gap-1.5">
              <Clock className={`size-3.5 ${metrics.deadlines > 0 ? 'text-[#DC2626]' : 'text-[#98A2B3]'}`} />
              Deadline Reminders
            </span>
            {metrics.deadlines > 0 && <span className="w-2 h-2 rounded-full bg-[#DC2626]" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-[22px] sm:text-[24px] font-bold tracking-tight ${
                metrics.deadlines > 0 ? 'text-[#DC2626]' : 'text-[#101828]'
              }`}
            >
              {metrics.deadlines}
            </span>
            <span className="text-[11px] text-[#667085]">time-critical</span>
          </div>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#E4E7EC] rounded-[8px] p-3 sm:p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-[#98A2B3]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[#D0D5DD] bg-white text-[13px] text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF] focus:border-[#5B5FEF]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#98A2B3] hover:text-[#475467]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {metrics.unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="h-9 px-3 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-semibold text-[#475467] hover:bg-[#F9FAFC] transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="size-3.5 text-[#5B5FEF]" />
                Mark all read
              </button>
            )}

            {notifications.some((n) => n.isRead) && (
              <button
                type="button"
                onClick={handleClearAllRead}
                disabled={isPending}
                className="h-9 px-3 rounded-[6px] border border-[#D0D5DD] bg-white text-[12px] font-semibold text-[#DC2626] hover:bg-red-50 hover:border-[#FECACA] transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Clear read
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[#EEF1F5]">
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${metrics.unread})` },
            { id: 'TASKS', label: `Tasks & Reviews (${metrics.tasks})` },
            { id: 'DEADLINES', label: `Deadlines (${metrics.deadlines})` },
            { id: 'PROJECTS', label: 'Projects & Hub' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as NotificationFilterTab)}
              className={`h-7 px-2.5 rounded-[4px] text-[11px] font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#101828] text-white'
                  : 'text-[#475467] hover:bg-[#F2F4F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="bg-white border border-[#E4E7EC] rounded-[8px] overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F2F4F7] text-[#667085] mx-auto flex items-center justify-center mb-3">
              <Bell className="size-6 text-[#98A2B3]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#101828]">No notifications</h3>
            <p className="text-[13px] text-[#667085] mt-1 max-w-sm mx-auto">
              {search || activeTab !== 'ALL'
                ? 'No alerts match your current filter criteria.'
                : "You're all caught up! There are no unread notifications at this time."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF1F5]">
            {filteredNotifications.map((notif) => {
              const link = getLink(notif);

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 sm:px-4 sm:py-3 flex items-start justify-between gap-3.5 hover:bg-[#F9FAFC] transition-colors ${
                    !notif.isRead ? 'bg-[#F9FAFC]/70' : 'bg-white'
                  }`}
                >
                  {/* Left: Icon & Content */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-[6px] border shrink-0 mt-0.5 ${getIconBg(
                        notif.type
                      )}`}
                    >
                      {getIcon(notif.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-[13px] ${
                            !notif.isRead ? 'font-bold text-[#101828]' : 'font-medium text-[#475467]'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="size-1.5 rounded-full bg-[#5B5FEF]" />
                        )}
                      </div>

                      <p className="text-[12px] text-[#475467] mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-[#98A2B3]">
                        <span>{formatTimestamp(notif.createdAt)}</span>
                        {link && (
                          <>
                            <span>•</span>
                            <Link
                              href={link}
                              className="text-[#5B5FEF] font-semibold hover:underline flex items-center gap-0.5"
                            >
                              View item
                              <ArrowUpRight className="size-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-1 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#5B5FEF] hover:bg-[#EFF6FF] transition-colors"
                        title="Mark as read"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(notif.id)}
                      className="p-1 rounded-[4px] border border-[#D0D5DD] bg-white text-[#475467] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
