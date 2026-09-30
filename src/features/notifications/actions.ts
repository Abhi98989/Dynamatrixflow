"use server";

import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";

export async function getUnreadNotificationCountAction() {
  try {
    const currentUser = await requireActiveUser();
    const count = await db.notification.count({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
    });
    return { count };
  } catch (error: unknown) {
    console.error("Failed to get notification count:", error);
    return { error: "Failed to fetch count", count: 0 };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const currentUser = await requireActiveUser();
    await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to mark notification read:", error);
    return { error: "Failed to update notification" };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const currentUser = await requireActiveUser();
    await db.notification.updateMany({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to mark all read:", error);
    return { error: "Failed to update notifications" };
  }
}

export async function getRecentNotificationsAction() {
  try {
    const currentUser = await requireActiveUser();
    const notifications = await db.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return { notifications };
  } catch (error: unknown) {
    console.error("Failed to get recent notifications:", error);
    return { error: "Failed to fetch", notifications: [] };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const currentUser = await requireActiveUser();
    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: currentUser.id,
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete notification:", error);
    return { error: "Failed to delete notification" };
  }
}

export async function clearAllReadNotificationsAction() {
  try {
    const currentUser = await requireActiveUser();
    await db.notification.deleteMany({
      where: {
        userId: currentUser.id,
        isRead: true,
      },
    });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to clear read notifications:", error);
    return { error: "Failed to clear notifications" };
  }
}
