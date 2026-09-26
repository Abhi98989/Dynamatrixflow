import { Metadata } from 'next';
import { db } from '@/server/db/client';
import { requireActiveUser } from '@/server/auth/authorization';
import { NotificationList, NotificationItem } from '@/features/notifications/notification-list';
import { Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Notifications | Dynamatrix Flow',
  description: 'Stay updated on project assignments, deliverable reviews, and deadlines.',
};

export default async function NotificationsPage() {
  const currentUser = await requireActiveUser();

  const rawNotifications = await db.notification.findMany({
    where: { userId: currentUser.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const notifications: NotificationItem[] = rawNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    entityType: n.entityType,
    entityId: n.entityId,
    projectId: n.projectId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E4E7EC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-[#101828] flex items-center gap-2">
              <Bell className="size-5 text-[#5B5FEF]" />
              Notifications
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#475467]">
            Real-time activity alerts on project assignments, review requests, and upcoming deliverable checkpoints.
          </p>
        </div>
      </div>

      <NotificationList initialNotifications={notifications} />
    </div>
  );
}
