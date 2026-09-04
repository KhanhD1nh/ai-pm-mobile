import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, issueKeys } from '@/features/issues/public';
import { projectsApi, projectKeys } from '@/features/projects/public';

export function useGlobalSearch(orgId: string | null | undefined, query: string) {
  const projects = useQuery({
    queryKey: projectKeys.list(orgId),
    queryFn: projectsApi.list,
    enabled: !!orgId,
  });
  const issues = useQuery({
    queryKey: issueKeys.search(orgId, query),
    queryFn: () => issuesApi.list({ q: query.trim(), limit: 50 }),
    enabled: !!orgId && query.trim().length >= 2,
  });
  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return (projects.data ?? []).filter((project) =>
      project.name.toLowerCase().includes(term) || project.key.toLowerCase().includes(term),
    );
  }, [projects.data, query]);

  return { projects: filteredProjects, issues: issues.data ?? [], issueQuery: issues };
}
