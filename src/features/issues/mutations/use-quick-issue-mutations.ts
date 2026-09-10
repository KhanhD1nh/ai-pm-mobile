import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planningKeys } from "@/features/planning/public";
import { projectKeys } from "@/features/projects/public";
import type { Issue, Priority } from "@/shared/contracts";
import { issuesApi } from "../api/issues-api";
import { issueKeys } from "../query-keys";

export type QuickIssuePatch = {
  statusId?: string;
  priority?: Priority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export function useQuickUpdateIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issue, patch }: { issue: Issue; patch: QuickIssuePatch }) =>
      issuesApi.update(issue.identifier, {
        ...patch,
        expectedVersion: issue.version,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
    },
  });
}

export function useQuickScheduleIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issue,
      startsAt,
      durationHours,
    }: {
      issue: Issue;
      startsAt: string;
      durationHours: number;
    }) => issuesApi.schedule(issue.identifier, startsAt, durationHours),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueKeys.all });
      if (projectId)
        await queryClient.invalidateQueries({
          queryKey: planningKeys.schedule(projectId),
        });
    },
  });
}
