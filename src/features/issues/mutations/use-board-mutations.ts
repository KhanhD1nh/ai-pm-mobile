import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectKeys } from '@/features/projects/public';
import { issuesApi } from '../api/issues-api';
import { issueKeys } from '../query-keys';

export type CreateIssueInput = {
  title: string;
  description?: string;
  priority: string;
  statusId?: string;
  assigneeId?: string;
};

export function useCreateIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => issuesApi.create({ projectId, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.project(projectId) }),
  });
}

export function useQuickMoveIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, version, statusId }: { identifier: string; version: number; statusId: string }) =>
      issuesApi.update(identifier, { statusId, expectedVersion: version }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.project(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
    },
  });
}
