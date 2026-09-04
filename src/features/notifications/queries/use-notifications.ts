import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications-api';
import { notificationKeys } from '../query-keys';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsApi.list(unreadOnly),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.unreadCount,
  });
}
