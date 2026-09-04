import { useEffect } from 'react';
import { AppState } from 'react-native';
import EventSource from 'react-native-sse';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { issueKeys } from '@/features/issues/public';
import { notificationKeys } from '@/features/notifications/public';
import { projectKeys } from '@/features/projects/public';
import { sessionStorage } from '@/infrastructure/auth/session-storage';
import { syncAppBadge } from '@/infrastructure/push/push-service';
import { useAuth } from '@/providers/auth-provider';

export function RealtimeBootstrap() {
  const { user, orgId } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || !orgId) return;
    let source: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await sessionStorage.getToken();
      if (!token || cancelled || AppState.currentState !== 'active') return;
      source?.close();
      source = new EventSource(`${env.apiBaseUrl}/realtime-stream`, {
        headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
      });
      (source as any).addEventListener('notification.created', () => {
        void qc.invalidateQueries({ queryKey: notificationKeys.list() });
        void qc.invalidateQueries({ queryKey: notificationKeys.unread() });
        void syncAppBadge();
      });
      for (const event of ['issue.created', 'issue.updated', 'issue.deleted', 'cycle.updated', 'milestone.updated']) {
        source.addEventListener(event as any, () => {
          void qc.invalidateQueries({ queryKey: issueKeys.all });
          void qc.invalidateQueries({ queryKey: projectKeys.all });
        });
      }
    };

    void connect();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void connect();
      else {
        source?.close();
        source = null;
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
      source?.close();
    };
  }, [userId, orgId, qc]);

  return null;
}
