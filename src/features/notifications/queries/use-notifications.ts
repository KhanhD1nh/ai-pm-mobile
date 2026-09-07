import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications-api';
import { notificationKeys } from '../query-keys';

export function useNotifications(orgId?: string | null, unreadOnly = false) {
  return useQuery({
    queryKey: notificationKeys.list(orgId, unreadOnly),
    queryFn: () => notificationsApi.list(unreadOnly),
    enabled: !!orgId,
  });
}

export function useUnreadNotificationCount(orgId?: string | null) {
  return useQuery({
    queryKey: notificationKeys.unread(orgId),
    queryFn: notificationsApi.unreadCount,
    enabled: !!orgId,
  });
}
