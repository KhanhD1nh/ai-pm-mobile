import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '@/features/issues/public';
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
    queryKey: planningKeys.schedule(projectId),
    queryFn: () => issuesApi.calendar(projectId!),
    enabled: !!projectId,
  });

  const scheduled = issues.data ?? [];

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

export function useProjectCycles(projectId?: string | null) {
  return useQuery({
    queryKey: planningKeys.cycles(projectId),
    queryFn: () => planningApi.cycles(projectId!),
    enabled: !!projectId,
  });
}
