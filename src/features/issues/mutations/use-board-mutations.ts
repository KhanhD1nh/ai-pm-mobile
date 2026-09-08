import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { projectKeys } from "@/features/projects/public";
import type { Issue } from "@/shared/contracts";
import { issuesApi } from "../api/issues-api";
import { issueKeys } from "../query-keys";

export type CreateIssueInput = {
  title: string;
  description?: string;
  priority: string;
  statusId?: string;
  assigneeId?: string;
  cycleId?: string;
  participants?: { userId: string; role: string }[];
  participantIds?: string[];
};

export function useCreateIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) =>
      issuesApi.create({ projectId, ...input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: issueKeys.project(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: issueKeys.projectInfinite(projectId),
        }),
      ]);
    },
  });
}

export function useQuickMoveIssue(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      version,
      statusId,
    }: {
      identifier: string;
      version: number;
      statusId: string;
    }) => issuesApi.update(identifier, { statusId, expectedVersion: version }),
    onMutate: async ({ identifier, statusId }) => {
      const queryKey = issueKeys.projectInfinite(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<InfiniteData<Issue[]>>({
        queryKey,
      });
      queryClient.setQueriesData<InfiniteData<Issue[]>>(
        { queryKey },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) =>
              page.map((issue) =>
                issue.identifier === identifier
                  ? {
                      ...issue,
                      status_id: statusId,
                      status: undefined,
                      version: issue.version + 1,
                      updated_at: new Date().toISOString(),
                    }
                  : issue,
              ),
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key as QueryKey, data);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: issueKeys.project(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: issueKeys.projectInfinite(projectId),
        }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
    },
  });
}
