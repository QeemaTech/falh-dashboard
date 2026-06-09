import { http } from "./http";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    unreadCount?: number;
  };
};

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsResult = {
  items: NotificationRecord[];
  unreadCount: number;
  meta: ApiResponse<NotificationRecord[]>["meta"];
};

export async function fetchMyNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const { data } = await http.get<ApiResponse<NotificationRecord[]>>("/notifications", {
    params: {
      page: 1,
      limit: 20,
      unreadOnly: false,
      ...(params || {}),
    },
  });
  return {
    items: data.data,
    unreadCount: data.meta?.unreadCount ?? 0,
    meta: data.meta,
  } satisfies NotificationsResult;
}

export async function markNotificationAsReadApi(notificationId: string) {
  const { data } = await http.patch<ApiResponse<NotificationRecord>>(`/notifications/${notificationId}/read`);
  return data.data;
}

export async function markAllNotificationsAsReadApi() {
  const { data } = await http.patch<ApiResponse<{ updatedCount: number }>>("/notifications/read-all");
  return data.data;
}
