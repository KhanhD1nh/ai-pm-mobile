import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects-api';
import { projectKeys } from '../query-keys';

export function useProjects(orgId?: string | null) {
  return useQuery({ queryKey: projectKeys.list(orgId), queryFn: projectsApi.list, enabled: !!orgId });
}

export function useProject(projectId?: string | null) {
  return useQuery({ queryKey: projectKeys.detail(projectId), queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
}

export function useProjectReport(projectKey?: string | null) {
  return useQuery({ queryKey: projectKeys.report(projectKey), queryFn: () => projectsApi.report(projectKey!), enabled: !!projectKey });
}

export function useProjectTags(projectId?: string | null) {
  return useQuery({ queryKey: projectKeys.tags(projectId), queryFn: () => projectsApi.tags(projectId!), enabled: !!projectId });
}
