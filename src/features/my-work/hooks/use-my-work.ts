import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, issueKeys } from '@/features/issues/public';

export function useMyWork(orgId?: string | null, userId?: string | null) {
  const query = useQuery({
    queryKey: issueKeys.myWork(orgId, userId),
    queryFn: () => issuesApi.list({
      assigneeId: userId!,
      limit: 100,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    }),
    enabled: !!orgId && !!userId,
  });

  const sections = useMemo(() => {
    const issues = query.data ?? [];
    const snapshotTime = query.dataUpdatedAt || 0;
    const snapshotDate = snapshotTime > 0 ? new Date(snapshotTime) : null;
    const todayKey = snapshotDate
      ? `${snapshotDate.getFullYear()}-${String(snapshotDate.getMonth() + 1).padStart(2, '0')}-${String(snapshotDate.getDate()).padStart(2, '0')}`
      : null;
    const overdue = issues.filter((issue) =>
      Boolean(issue.due_date) &&
      Boolean(todayKey) &&
      issue.due_date!.slice(0, 10) < todayKey! &&
      issue.status?.category !== 'DONE',
    );

    return {
      issues,
      sections: [
        ['Quá hạn', overdue],
        ['Đang thực hiện', issues.filter((issue) => issue.status?.category === 'IN_PROGRESS')],
        ['Review', issues.filter((issue) => issue.status?.category === 'IN_REVIEW')],
        ['Sắp tới', issues.filter((issue) => ['TODO', 'BACKLOG'].includes(issue.status?.category ?? ''))],
      ] as const,
    };
  }, [query.data, query.dataUpdatedAt]);

  return { query, ...sections };
}
