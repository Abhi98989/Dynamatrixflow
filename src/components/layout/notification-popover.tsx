"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckSquare,
  Clock,
  FolderKanban,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getRecentNotificationsAction,
  getUnreadNotificationCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/features/notifications/actions";

interface PopoverNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  projectId: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

function timeAgo(date: Date | string): string {
  const past = new Date(date).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_REASSIGNED":
    case "TASK_REVIEWED":
      return <CheckSquare className="size-3.5 text-blue-600" />;
    case "TASK_DUE_SOON":
    case "TASK_OVERDUE":
      return <Clock className="size-3.5 text-amber-600" />;
    case "TASK_COMMENT":
      return <MessageSquare className="size-3.5 text-purple-600" />;
    case "PROJECT_ASSIGNED":
      return <FolderKanban className="size-3.5 text-emerald-600" />;
    case "TASK_BLOCKED":
      return <AlertCircle className="size-3.5 text-red-600" />;
    default:
      return <Bell className="size-3.5 text-slate-500" />;
  }
}

function getNotificationLink(n: PopoverNotification): string {
  if (n.projectId && n.entityType === "Task" && n.entityId) {
    return `/projects/${n.projectId}/tasks/${n.entityId}`;
  }
  if (n.projectId) {
    return `/projects/${n.projectId}`;
  }
  return "/notifications";
}

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<PopoverNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      const [countRes, recentsRes] = await Promise.all([
        getUnreadNotificationCountAction(),
        getRecentNotificationsAction(),
      ]);

      if (typeof countRes.count === "number") {
        setUnreadCount(countRes.count);
      }
      if (recentsRes.notifications) {
        setNotifications(recentsRes.notifications as unknown as PopoverNotification[]);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    // Poll every 30s for notifications
    const interval = setInterval(loadData, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-[10px] font-bold text-white flex items-center justify-center border-2 border-white leading-none shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        role="dialog"
        aria-label="Notifications"
        className="w-[360px] sm:w-[400px] p-0 shadow-xl border border-slate-200 rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                {unreadCount} new
              </span>
            ) : null}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="text-[11px] font-medium text-slate-500 hover:text-[#5B5FEF] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List of recent notifications */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#5B5FEF]" />
              <span className="text-xs">Loading alerts...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => {
              const link = getNotificationLink(n);
              return (
                <div
                  key={n.id}
                  className={`p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 relative ${
                    !n.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 size-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <Link
                        href={link}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n.id);
                          setOpen(false);
                        }}
                        className="text-xs font-semibold text-slate-900 hover:text-[#5B5FEF] truncate block"
                      >
                        {n.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Mark as read"
                      className="mt-1 size-2 rounded-full bg-[#5B5FEF] shrink-0 hover:scale-125 transition-transform"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50/80 border-t border-slate-200 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold text-[#5B5FEF] hover:text-[#4a4ee4] inline-flex items-center gap-1.5 transition-colors"
          >
            View all notifications
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
