import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, issueKeys } from '@/features/issues/public';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { planningApi } from '../api/planning-api';
import { planningKeys } from '../query-keys';

export function usePlanning(projectId?: string | null) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });
  const cycles = useQuery({
    queryKey: planningKeys.cycles(projectId),
    queryFn: () => planningApi.cycles(projectId!),
    enabled: !!projectId,
  });
  const milestones = useQuery({
    queryKey: planningKeys.milestones(projectId),
    queryFn: () => planningApi.milestones(projectId!),
    enabled: !!projectId,
  });
  const issues = useQuery({
    queryKey: issueKeys.project(projectId),
    queryFn: () => issuesApi.list({ projectId: projectId!, limit: 200 }),
    enabled: !!projectId,
  });

  const scheduled = useMemo(
    () => (issues.data ?? [])
      .filter((issue) => issue.scheduled_start)
      .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()),
    [issues.data],
  );

  return {
    project,
    cycles,
    milestones,
    issues,
    scheduled,
    refreshing: cycles.isRefetching || milestones.isRefetching,
    refresh: async () => {
      await Promise.all([cycles.refetch(), milestones.refetch(), issues.refetch()]);
    },
  };
}
