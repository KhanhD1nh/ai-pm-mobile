import { useQuery } from '@tanstack/react-query';
import { membersApi, memberKeys } from '@/features/members/public';
import { planningApi, planningKeys } from '@/features/planning/public';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { workflowsApi, workflowKeys } from '@/features/workflows/public';
import { issuesApi } from '../api/issues-api';
import { issueKeys } from '../query-keys';

export function useBoardData(projectId?: string | null) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });
  const statuses = useQuery({
    queryKey: workflowKeys.statuses(projectId),
    queryFn: () => workflowsApi.statuses(projectId!),
    enabled: !!projectId,
  });
  const members = useQuery({
    queryKey: memberKeys.project(projectId),
    queryFn: () => membersApi.list(projectId!),
    enabled: !!projectId,
  });
  const cycles = useQuery({
    queryKey: planningKeys.cycles(projectId),
    queryFn: () => planningApi.cycles(projectId!),
    enabled: !!projectId,
  });
  const issues = useQuery({
    queryKey: issueKeys.project(projectId),
    queryFn: () => issuesApi.list({ projectId: projectId!, limit: 200 }),
    enabled: !!projectId,
  });

  return {
    project,
    statuses,
    members,
    cycles,
    issues,
    refresh: async () => {
      await Promise.all([issues.refetch(), statuses.refetch(), members.refetch(), cycles.refetch()]);
    },
  };
}
