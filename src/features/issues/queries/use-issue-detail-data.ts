import { useQuery } from '@tanstack/react-query';
import { membersApi, memberKeys } from '@/features/members/public';
import { planningApi, planningKeys } from '@/features/planning/public';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { workflowsApi, workflowKeys } from '@/features/workflows/public';
import { issuesApi } from '../api/issues-api';
import { issueKeys } from '../query-keys';

export function useIssueDetailData(identifier?: string | null, orgId?: string | null) {
  const issue = useQuery({
    queryKey: issueKeys.detail(orgId, identifier),
    queryFn: () => issuesApi.get(identifier!),
    enabled: !!identifier,
  });
  const projectId = issue.data?.project_id;
  const issueId = issue.data?.id;
  const contextReady = !issue.data?.organization_id || issue.data.organization_id === orgId;

  const statuses = useQuery({
    queryKey: workflowKeys.statuses(projectId),
    queryFn: () => workflowsApi.statuses(projectId!),
    enabled: !!projectId && contextReady,
  });
  const members = useQuery({
    queryKey: memberKeys.project(projectId),
    queryFn: () => membersApi.list(projectId!),
    enabled: !!projectId && contextReady,
  });
  const cycles = useQuery({
    queryKey: planningKeys.cycles(projectId),
    queryFn: () => planningApi.cycles(projectId!),
    enabled: !!projectId && contextReady,
  });
  const milestones = useQuery({
    queryKey: planningKeys.milestones(projectId),
    queryFn: () => planningApi.milestones(projectId!),
    enabled: !!projectId && contextReady,
  });
  const tags = useQuery({
    queryKey: projectKeys.tags(projectId),
    queryFn: () => projectsApi.tags(projectId!),
    enabled: !!projectId && contextReady,
  });
  const comments = useQuery({
    queryKey: issueKeys.comments(issueId),
    queryFn: () => issuesApi.comments(issueId!),
    enabled: !!issueId && contextReady,
  });
  const participants = useQuery({
    queryKey: issueKeys.participants(orgId, identifier),
    queryFn: () => issuesApi.participants(identifier!),
    enabled: !!identifier && !!issue.data && contextReady,
  });
  const relations = useQuery({
    queryKey: issueKeys.relations(issueId),
    queryFn: () => issuesApi.relations(issueId!),
    enabled: !!issueId && contextReady,
  });

  return {
    issue,
    projectId,
    statuses,
    members,
    cycles,
    milestones,
    tags,
    comments,
    participants,
    relations,
    refresh: async () => {
      await Promise.all([issue.refetch(), comments.refetch(), participants.refetch(), relations.refetch()]);
    },
  };
}
