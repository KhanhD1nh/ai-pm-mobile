import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { routeFromNotificationData, syncAppBadge } from '@/services/notifications';
import { settingsApi } from '@/services/api';

export function NotificationBootstrap() {
  const { ready, user, orgId, selectOrganization } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!ready || !user) return;
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
        try { await settingsApi.markRead(notificationId); } catch { /* navigate even if read-sync fails */ }
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['notifications'] }),
          qc.invalidateQueries({ queryKey: ['notification-unread'] }),
        ]);
        void syncAppBadge();
      }
      const route = routeFromNotificationData(data);
      if (route) router.push(route as any);
    };

    const received = Notifications.addNotificationReceivedListener(() => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['notification-unread'] });
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

    return () => { received.remove(); opened.remove(); };
  }, [ready, user?.id, orgId, selectOrganization, qc]);

  return null;
}
