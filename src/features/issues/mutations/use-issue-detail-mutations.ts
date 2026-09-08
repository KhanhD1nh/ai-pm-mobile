import { useMutation, useQueryClient } from "@tanstack/react-query";
import { planningApi, planningKeys } from "@/features/planning/public";
import { projectKeys } from "@/features/projects/public";
import { isOfflineMutationReceipt } from "@/infrastructure/persistence/offline-mutation-queue";
import type { Issue } from "@/shared/contracts";
import { issuesApi } from "../api/issues-api";
import { issueKeys } from "../query-keys";

function useIssueInvalidation(
  identifier?: string | null,
  orgId?: string | null,
) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: issueKeys.detail(orgId, identifier),
      }),
      queryClient.invalidateQueries({ queryKey: issueKeys.all }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    ]);
  };
}

export function useUpdateIssue(
  identifier?: string | null,
  version?: number,
  orgId?: string | null,
) {
  const queryClient = useQueryClient();
  const invalidate = useIssueInvalidation(identifier, orgId);
  const key = issueKeys.detail(orgId, identifier);
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      issuesApi.update(identifier!, { ...data, expectedVersion: version }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Issue>(key);
      if (previous) {
        const next: Issue = {
          ...previous,
          version: previous.version + 1,
          updated_at: new Date().toISOString(),
        };
        if (typeof data.title === "string") next.title = data.title;
        if (data.description === null || typeof data.description === "string")
          next.description = data.description as string | null;
        if (typeof data.priority === "string")
          next.priority = data.priority as Issue["priority"];
        if (typeof data.statusId === "string") {
          next.status_id = data.statusId;
          next.status = undefined;
        }
        if (data.assigneeId === null || typeof data.assigneeId === "string")
          next.assignee_id = data.assigneeId as string | null;
        if (data.milestoneId === null || typeof data.milestoneId === "string")
          next.milestone_id = data.milestoneId as string | null;
        if (data.dueDate === null || typeof data.dueDate === "string")
          next.due_date = data.dueDate as string | null;
        queryClient.setQueryData(key, next);
      }
      return { previous };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: async (result) => {
      if (!isOfflineMutationReceipt(result))
        queryClient.setQueryData(key, result);
      await invalidate();
    },
  });
}

export function useMoveIssueCycle(
  projectId?: string | null,
  issue?: Issue | null,
  orgId?: string | null,
) {
  const invalidate = useIssueInvalidation(issue?.identifier, orgId);
  return useMutation({
    mutationFn: async (cycleId: string | null) => {
      if (!projectId || !issue) return;
      if (issue.cycle_id && issue.cycle_id !== cycleId) {
        await planningApi.removeIssueFromCycle(
          projectId,
          issue.cycle_id,
          issue.id,
        );
      }
      if (cycleId)
        await planningApi.addIssueToCycle(projectId, cycleId, issue.id);
    },
    onSuccess: invalidate,
  });
}

export function useAddIssueComment(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => issuesApi.addComment(issueId!, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(issueId) }),
  });
}

export function useDeleteIssueComment(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      issuesApi.deleteComment(issueId!, commentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(issueId) }),
  });
}

export function useAddIssueParticipant(
  identifier?: string | null,
  orgId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      issuesApi.addParticipant(identifier!, userId, role),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: issueKeys.participants(orgId, identifier),
      }),
  });
}

export function useRemoveIssueParticipant(
  identifier?: string | null,
  orgId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) =>
      issuesApi.removeParticipant(identifier!, participantId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: issueKeys.participants(orgId, identifier),
      }),
  });
}

export function useCreateIssueRelation(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetIdentifier,
      type,
    }: {
      targetIdentifier: string;
      type: string;
    }) => {
      const target = await issuesApi.get(targetIdentifier);
      return issuesApi.createRelation(issueId!, target.id, type);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issueKeys.relations(issueId) }),
  });
}

export function useDeleteIssueRelation(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issuesApi.deleteRelation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: issueKeys.relations(issueId) }),
  });
}

export function useScheduleIssue(
  identifier?: string | null,
  orgId?: string | null,
  projectId?: string | null,
) {
  const queryClient = useQueryClient();
  const invalidate = useIssueInvalidation(identifier, orgId);
  return useMutation({
    mutationFn: ({
      startsAt,
      durationHours,
    }: {
      startsAt: string;
      durationHours: number;
    }) => issuesApi.schedule(identifier!, startsAt, durationHours),
    onSuccess: async () => {
      await invalidate();
      if (projectId)
        await queryClient.invalidateQueries({
          queryKey: planningKeys.schedule(projectId),
        });
    },
  });
}

export function useArchiveIssue(identifier?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => issuesApi.archive(identifier!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
    },
  });
}
