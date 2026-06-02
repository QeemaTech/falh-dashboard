import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { useAuth } from "../../store/auth-store";
import { fetchUserNotifications, type AdminNotification } from "../../services/admin-api";

type NotificationRow = {
  type: string;
  title: string;
  body: string;
  isRead: string;
  createdAt: string;
};

export function NotificationsPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-notifications", user?.id],
    queryFn: () => fetchUserNotifications(user!.id, { page: 1, limit: 100 }),
    enabled: Boolean(user?.id),
  });

  const rows = useMemo<NotificationRow[]>(() => {
    const items = (data?.items || []) as AdminNotification[];
    return items.map((notification) => ({
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead ? "Read" : "Unread",
      createdAt: new Date(notification.createdAt).toLocaleString(),
    }));
  }, [data?.items]);

  if (isLoading) return <Card>Loading notifications...</Card>;
  if (isError) return <Card>Failed to load notifications: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No notifications found.</Card>;

  return (
    <ReusableTable<NotificationRow>
      title="Notifications"
      columns={[
        { key: "type", label: "Type" },
        { key: "title", label: "Title" },
        { key: "body", label: "Message" },
        { key: "isRead", label: "Read" },
        { key: "createdAt", label: "Created At" },
      ]}
      data={rows}
    />
  );
}
