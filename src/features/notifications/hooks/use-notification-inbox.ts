import { useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import type { NotificationItem } from '@/shared/contracts';
import { useNotifications, useUnreadNotificationCount } from '../queries/use-notifications';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../mutations/use-notification-mutations';
import { matchesNotificationFilter, type NotificationFilter } from '../model/notification-filter';

export function useNotificationInbox(filter: NotificationFilter) {
  const { orgId, selectOrganization } = useAuth();
  const notifications = useNotifications(orgId, false);
  const unread = useUnreadNotificationCount(orgId);
  const markRead = useMarkNotificationRead(orgId);
  const markAll = useMarkAllNotificationsRead(orgId);

  const items = useMemo(
    () => (notifications.data ?? []).filter((notification) => matchesNotificationFilter(filter, notification)),
    [notifications.data, filter],
  );

  const prepareOpen = async (notification: NotificationItem) => {
    if (notification.org_id && notification.org_id !== orgId) {
      await selectOrganization(notification.org_id);
    }
    if (!notification.read) markRead.mutate(notification.id);
  };

  return {
    notifications,
    unread,
    markAll,
    items,
    prepareOpen,
    refresh: async () => {
      await Promise.all([notifications.refetch(), unread.refetch()]);
    },
  };
}
