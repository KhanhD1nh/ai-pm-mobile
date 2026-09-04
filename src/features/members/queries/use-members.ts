import { useQuery } from '@tanstack/react-query';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { settingsApi, settingsKeys } from '@/features/settings/public';
import { membersApi } from '../api/members-api';
import { memberKeys } from '../query-keys';

export function useProjectMembers(projectId?: string | null) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });
  const members = useQuery({
    queryKey: memberKeys.project(projectId),
    queryFn: () => membersApi.list(projectId!),
    enabled: !!projectId,
  });
  return { project, members };
}

export function useMemberSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: settingsKeys.users(query),
    queryFn: () => settingsApi.users(query),
    enabled: enabled && query.trim().length > 1,
  });
}
