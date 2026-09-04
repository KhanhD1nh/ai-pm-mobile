import { useEffect } from 'react';
import { AppState } from 'react-native';
import EventSource from 'react-native-sse';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/api';
import { sessionStorage } from '@/lib/storage';
import { useAuth } from '@/contexts/auth-context';
import { syncAppBadge } from '@/services/notifications';

export function RealtimeBootstrap() {
  const { user, orgId } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user || !orgId) return;
    let source: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
      const token = await sessionStorage.getToken();
      if (!token || cancelled || AppState.currentState !== 'active') return;
      source?.close();
      source = new EventSource(`${API_BASE_URL}/realtime-stream`, { headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId } });
      (source as any).addEventListener('notification.created', () => {
        void qc.invalidateQueries({ queryKey: ['notifications'] });
        void qc.invalidateQueries({ queryKey: ['notification-unread'] });
        void syncAppBadge();
      });
      for (const event of ['issue.created', 'issue.updated', 'issue.deleted', 'cycle.updated', 'milestone.updated']) {
        source.addEventListener(event as any, () => {
          void qc.invalidateQueries({ queryKey: ['issues'] });
          void qc.invalidateQueries({ queryKey: ['my-work'] });
          void qc.invalidateQueries({ queryKey: ['project-report'] });
        });
      }
    };

    void connect();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void connect(); else { source?.close(); source = null; }
    });
    return () => { cancelled = true; sub.remove(); source?.close(); };
  }, [user?.id, orgId, qc]);

  return null;
}
