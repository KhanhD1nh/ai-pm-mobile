import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi, notificationKeys } from '@/features/notifications/public';
import { useAuth } from '@/providers/auth-provider';
import { routeFromNotificationData, syncAppBadge } from '@/infrastructure/push/push-service';

export function NotificationBootstrap() {
  const { ready, user, orgId, selectOrganization } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  useEffect(() => {
    if (!ready || !userId) return;
    void syncAppBadge();

    const handleOpen = async (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      const targetOrgId = typeof data.orgId === 'string' ? data.orgId : null;
      if (targetOrgId && targetOrgId !== orgId) {
        await selectOrganization(targetOrgId);
        await qc.invalidateQueries();
      }
      const notificationId = typeof data.notificationId === 'string' ? data.notificationId : null;
      if (notificationId) {
        try { await notificationsApi.markRead(notificationId); } catch { /* navigate even if read-sync fails */ }
        await Promise.all([
          qc.invalidateQueries({ queryKey: notificationKeys.list() }),
          qc.invalidateQueries({ queryKey: notificationKeys.unread() }),
        ]);
        void syncAppBadge();
      }
      const route = routeFromNotificationData(data);
      if (route) router.push(route as any);
    };

    const received = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list() });
      void qc.invalidateQueries({ queryKey: notificationKeys.unread() });
      void syncAppBadge();
    });

    const opened = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleOpen(response.notification.request.content.data as Record<string, unknown> | undefined);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      setTimeout(() => {
        void handleOpen(response.notification.request.content.data as Record<string, unknown> | undefined);
      }, 150);
    });

    return () => {
      received.remove();
      opened.remove();
    };
  }, [ready, userId, orgId, selectOrganization, qc]);

  return null;
}
