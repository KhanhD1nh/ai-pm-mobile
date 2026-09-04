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
    const overdue = issues.filter((issue) =>
      Boolean(issue.due_date) &&
      new Date(issue.due_date!).getTime() < snapshotTime &&
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
