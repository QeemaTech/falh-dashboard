import { useMemo } from "react";
import { DoneAll } from "@mui/icons-material";
import { Button, Chip, Stack } from "@mui/material";
import { DataTable, EmptyState, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  formatNotificationDate,
  localizeNotification,
  notificationTypeLabel,
} from "./notification-utils";
import { useNotifications } from "./use-notifications";
import type { NotificationRecord } from "../../services/notifications-api";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: string;
  createdAt: string;
  _raw: NotificationRecord;
};

export function NotificationsPage() {
  const { t, language } = useI18n();
  const { items, isLoading, isError, error, markAsRead, markAllAsRead, unreadCount, isMarkingRead } =
    useNotifications(100);

  const rows = useMemo<NotificationRow[]>(() => {
    return items.map((notification) => {
      const localized = localizeNotification(notification, language, t);
      return {
        id: notification.id,
        type: notificationTypeLabel(notification.type, t),
        title: localized.title,
        body: localized.body,
        isRead: notification.isRead ? t("notifications.read") : t("notifications.unread"),
        createdAt: formatNotificationDate(notification.createdAt, language),
        _raw: notification,
      };
    });
  }, [items, language, t]);

  if (isError) {
    return (
      <EmptyState
        title={t("notifications.loadFailed")}
        description={(error as Error).message}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        action={
          unreadCount > 0 ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAll />}
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead}
            >
              {t("notifications.markAllRead")}
            </Button>
          ) : undefined
        }
      />

      <DataTable<NotificationRow>
        title={t("notifications.listTitle")}
        loading={isLoading}
        emptyMessage={t("notifications.empty")}
        getRowKey={(row) => row.id}
        onRowClick={(row) => {
          if (!row._raw.isRead) {
            markAsRead(row._raw.id);
          }
        }}
        columns={[
          { key: "type", label: t("notifications.col.type") },
          { key: "title", label: t("notifications.col.title") },
          { key: "body", label: t("notifications.col.message") },
          {
            key: "isRead",
            label: t("notifications.col.status"),
            render: (row) => (
              <Chip
                size="small"
                label={row.isRead}
                color={row._raw.isRead ? "default" : "primary"}
                variant={row._raw.isRead ? "outlined" : "filled"}
              />
            ),
          },
          { key: "createdAt", label: t("notifications.col.createdAt") },
        ]}
        data={rows}
      />
    </Stack>
  );
}
