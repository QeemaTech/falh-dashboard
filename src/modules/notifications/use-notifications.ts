import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyNotifications,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "../../services/notifications-api";

export const NOTIFICATIONS_QUERY_KEY = ["my-notifications"] as const;

export function useNotifications(limit = 20, page = 1) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, page, limit],
    queryFn: () => fetchMyNotifications({ page, limit }),
    refetchInterval: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    ...query,
    unreadCount: query.data?.unreadCount ?? 0,
    items: query.data?.items ?? [],
    meta: query.data?.meta,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
