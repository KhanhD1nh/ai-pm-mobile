import { useQuery } from "@tanstack/react-query";
import { projectsApi, projectKeys } from "@/features/projects/public";
import { settingsApi, settingsKeys } from "@/features/settings/public";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { membersApi } from "../api/members-api";
import { memberKeys } from "../query-keys";

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

export function useMemberSearch(
  query: string,
  enabled: boolean,
  projectId?: string | null,
) {
  const normalized = query.trim();
  const debounced = useDebouncedValue(normalized);
  return useQuery({
    queryKey: settingsKeys.users(projectId, debounced),
    queryFn: () => settingsApi.users(debounced),
    enabled:
      enabled && !!projectId && normalized.length > 1 && debounced.length > 1,
  });
}
