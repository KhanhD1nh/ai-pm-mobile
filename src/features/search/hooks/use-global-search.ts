import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { issuesApi, issueKeys } from '@/features/issues/public';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

export function useGlobalSearch(orgId: string | null | undefined, query: string) {
  const normalizedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(normalizedQuery);

  const projects = useQuery({
    queryKey: projectKeys.list(orgId),
    queryFn: projectsApi.list,
    enabled: !!orgId,
  });
  const issues = useQuery({
    queryKey: issueKeys.search(orgId, debouncedQuery),
    queryFn: () => issuesApi.list({ q: debouncedQuery, limit: 50 }),
    enabled: !!orgId && debouncedQuery.length >= 2,
  });
  const filteredProjects = useMemo(() => {
    const term = normalizedQuery.toLowerCase();
    if (!term) return [];
    return (projects.data ?? []).filter((project) =>
      project.name.toLowerCase().includes(term) || project.key.toLowerCase().includes(term),
    );
  }, [normalizedQuery, projects.data]);

  return {
    projects: filteredProjects,
    issues: debouncedQuery.length >= 2 ? (issues.data ?? []) : [],
    issueQuery: issues,
  };
}
