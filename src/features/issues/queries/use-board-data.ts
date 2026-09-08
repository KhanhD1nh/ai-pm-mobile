import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { membersApi, memberKeys } from "@/features/members/public";
import { planningApi, planningKeys } from "@/features/planning/public";
import { projectsApi, projectKeys } from "@/features/projects/public";
import { workflowsApi, workflowKeys } from "@/features/workflows/public";
import { issuesApi } from "../api/issues-api";
import { issueKeys } from "../query-keys";

export type BoardIssueFilters = {
  priority?: string;
  assigneeId?: string;
  unassigned?: boolean;
  cycleId?: string;
  q?: string;
};

export function useBoardData(
  projectId?: string | null,
  filters: BoardIssueFilters = {},
) {
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
  const issues = useInfiniteQuery({
    queryKey: issueKeys.projectInfiniteFiltered(projectId, filters),
    queryFn: ({ pageParam }) =>
      issuesApi.list({
        projectId: projectId!,
        priority: filters.priority,
        assigneeId: filters.assigneeId,
        unassigned: filters.unassigned ? "true" : undefined,
        cycleId: filters.cycleId,
        q: filters.q,
        limit: 30,
        offset: pageParam,
      }),
    enabled: !!projectId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < 30
        ? undefined
        : allPages.reduce((count, page) => count + page.length, 0),
  });

  return {
    project,
    statuses,
    members,
    cycles,
    issues,
    issueItems: issues.data?.pages.flat() ?? [],
    refresh: async () => {
      await Promise.all([
        issues.refetch(),
        statuses.refetch(),
        members.refetch(),
        cycles.refetch(),
      ]);
    },
  };
}
