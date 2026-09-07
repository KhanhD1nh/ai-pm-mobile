import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications-api';
import type { NotificationFilter } from '../model/notification-filter';
import { notificationKeys } from '../query-keys';

export const NOTIFICATION_PAGE_SIZE = 40;

export function useNotifications(orgId?: string | null, filter: NotificationFilter = 'ALL') {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(orgId, filter),
    queryFn: ({ pageParam }) => notificationsApi.list({ filter, limit: NOTIFICATION_PAGE_SIZE, offset: pageParam }),
    enabled: !!orgId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (
      lastPage.length < NOTIFICATION_PAGE_SIZE
        ? undefined
        : allPages.reduce((count, page) => count + page.length, 0)
    ),
  });
}

export function useUnreadNotificationCount(orgId?: string | null) {
  return useQuery({
    queryKey: notificationKeys.unread(orgId),
    queryFn: notificationsApi.unreadCount,
    enabled: !!orgId,
  });
}
