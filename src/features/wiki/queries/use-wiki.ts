import { useQuery } from '@tanstack/react-query';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { wikiApi } from '../api/wiki-api';
import { wikiKeys } from '../query-keys';

export function useProjectWiki(projectId?: string | null) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });
  const pages = useQuery({
    queryKey: wikiKeys.list(project.data?.key),
    queryFn: () => wikiApi.list(project.data!.key),
    enabled: !!project.data?.key,
  });
  return { project, pages };
}
