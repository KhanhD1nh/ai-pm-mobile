import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, issueKeys } from '@/features/issues/public';
import { notificationsApi, notificationKeys } from '@/features/notifications/public';
import { projectsApi, projectKeys } from '@/features/projects/public';

export function useHomeDashboard(orgId?: string | null, userId?: string | null) {
  const projects = useQuery({
    queryKey: projectKeys.list(orgId),
    queryFn: projectsApi.list,
    enabled: !!orgId,
  });
  const issues = useQuery({
    queryKey: issueKeys.myWork(orgId, userId),
    queryFn: () => issuesApi.list({ assigneeId: userId!, limit: 100, sortBy: 'updated_at', sortOrder: 'desc' }),
    enabled: !!orgId && !!userId,
  });
  const unread = useQuery({
    queryKey: notificationKeys.unread(orgId),
    queryFn: notificationsApi.unreadCount,
    enabled: !!orgId && !!userId,
  });

  const derived = useMemo(() => {
    const mine = issues.data ?? [];
    const snapshotTime = issues.dataUpdatedAt;
    const snapshotDate = snapshotTime > 0 ? new Date(snapshotTime) : null;
    const todayKey = snapshotDate
      ? `${snapshotDate.getFullYear()}-${String(snapshotDate.getMonth() + 1).padStart(2, '0')}-${String(snapshotDate.getDate()).padStart(2, '0')}`
      : null;
    return {
      mine,
      overdue: mine.filter((issue) => issue.due_date && todayKey && issue.due_date.slice(0, 10) < todayKey && issue.status?.category !== 'DONE'),
      inProgress: mine.filter((issue) => issue.status?.category === 'IN_PROGRESS'),
    };
  }, [issues.data, issues.dataUpdatedAt]);

  return {
    projects,
    issues,
    unread,
    ...derived,
    refreshing: projects.isRefetching || issues.isRefetching,
    refresh: async () => {
      await Promise.all([projects.refetch(), issues.refetch(), unread.refetch()]);
    },
  };
}
