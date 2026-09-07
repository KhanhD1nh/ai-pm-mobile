import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications-api';
import { notificationKeys } from '../query-keys';

async function invalidateNotificationQueries(queryClient: ReturnType<typeof useQueryClient>, orgId?: string | null) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.lists(orgId) }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.unread(orgId) }),
  ]);
}

export function useMarkNotificationRead(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => invalidateNotificationQueries(queryClient, orgId),
  });
}

export function useMarkAllNotificationsRead(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => invalidateNotificationQueries(queryClient, orgId),
  });
}
