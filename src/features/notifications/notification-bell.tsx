"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import {
  getUnreadNotificationCountAction,
  markNotificationReadAction,
} from "./actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// For the popover, we might want to fetch a few recent notifications.
// To keep the client component simple without adding complex data fetching hooks,
// we could either fetch them here via a server action or just link to the page.
// The MVP plan asks for a dropdown, so we'll fetch the latest 5 here.
import { getRecentNotificationsAction } from "./actions";

interface RecentNotification {
  id: string;
  title: string;
  message?: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentNotification[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const [countRes, recentRes] = await Promise.all([
          getUnreadNotificationCountAction(),
          getRecentNotificationsAction(),
        ]);
        if (!isMounted) return;
        if (countRes && typeof countRes.count === "number") {
          setUnreadCount(countRes.count);
        }
        if (recentRes && recentRes.notifications) {
          setRecent(recentRes.notifications as unknown as RecentNotification[]);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecent((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationReadAction(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-surface">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Notifications</h2>
          <span className="text-xs text-text-muted">{unreadCount} unread</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              You have no recent notifications.
            </div>
          ) : (
            <div className="flex flex-col">
              {recent.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex flex-col gap-1 p-3 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors ${notif.isRead ? "opacity-70" : "bg-primary/5"}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p
                      className={`text-xs ${notif.isRead ? "font-medium" : "font-semibold text-primary"}`}
                    >
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="text-text-muted hover:text-primary shrink-0"
                        title="Mark as read"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2">
                    {notif.message}
                  </p>
                  <span className="text-[9px] text-text-muted mt-1">
                    {new Date(notif.createdAt).toLocaleDateString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-border bg-surface-secondary/50 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
