import { useEffect } from 'react';
import { AppState } from 'react-native';
import EventSource from 'react-native-sse';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { issueKeys } from '@/features/issues/public';
import { notificationKeys } from '@/features/notifications/public';
import { planningKeys } from '@/features/planning/public';
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
      source.addEventListener('notification.created' as any, () => {
        void qc.invalidateQueries({ queryKey: notificationKeys.lists(orgId) });
        void qc.invalidateQueries({ queryKey: notificationKeys.unread(orgId) });
        void syncAppBadge();
      });

      const invalidateIssueEvent = (rawEvent: unknown) => {
        let payload: any = null;
        try {
          const data = (rawEvent as { data?: string })?.data;
          payload = data ? JSON.parse(data) : null;
        } catch {
          // A malformed realtime payload should never break the stream.
        }
        const projectId = payload?.project_id ?? payload?.data?.issue?.project_id ?? null;
        const identifier = payload?.data?.issue?.identifier ?? payload?.data?.identifier ?? null;

        if (projectId) {
          void qc.invalidateQueries({ queryKey: issueKeys.project(projectId) });
          void qc.invalidateQueries({ queryKey: issueKeys.projectInfinite(projectId) });
          void qc.invalidateQueries({ queryKey: planningKeys.schedule(projectId) });
          void qc.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'projects' && query.queryKey.includes(projectId),
          });
        }
        if (identifier) void qc.invalidateQueries({ queryKey: issueKeys.detail(orgId, identifier) });
        void qc.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'issues' && query.queryKey[1] === 'my-work' && query.queryKey[2] === orgId,
        });
      };

      for (const event of ['issue.created', 'issue.updated', 'issue.deleted']) {
        source.addEventListener(event as any, invalidateIssueEvent as any);
      }
      for (const event of ['cycle.updated', 'milestone.updated']) {
        source.addEventListener(event as any, (rawEvent: unknown) => {
          let projectId: string | null = null;
          try {
            const data = (rawEvent as { data?: string })?.data;
            const payload = data ? JSON.parse(data) : null;
            projectId = payload?.project_id ?? payload?.data?.project_id ?? null;
          } catch {
            // Ignore malformed event payloads.
          }
          if (!projectId) return;
          void qc.invalidateQueries({ queryKey: planningKeys.cycles(projectId) });
          void qc.invalidateQueries({ queryKey: planningKeys.milestones(projectId) });
          void qc.invalidateQueries({ queryKey: planningKeys.schedule(projectId) });
          void qc.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'projects' && query.queryKey.includes(projectId),
          });
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
