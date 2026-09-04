import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '@/features/planning/public';
import { projectKeys } from '@/features/projects/public';
import type { Issue } from '@/shared/contracts';
import { issuesApi } from '../api/issues-api';
import { issueKeys } from '../query-keys';

function useIssueInvalidation(identifier?: string | null) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(identifier) }),
      queryClient.invalidateQueries({ queryKey: issueKeys.all }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    ]);
  };
}

export function useUpdateIssue(identifier?: string | null, version?: number) {
  const invalidate = useIssueInvalidation(identifier);
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => issuesApi.update(identifier!, { ...data, expectedVersion: version }),
    onSuccess: invalidate,
  });
}

export function useMoveIssueCycle(projectId?: string | null, issue?: Issue | null) {
  const invalidate = useIssueInvalidation(issue?.identifier);
  return useMutation({
    mutationFn: async (cycleId: string | null) => {
      if (!projectId || !issue) return;
      if (issue.cycle_id && issue.cycle_id !== cycleId) {
        await planningApi.removeIssueFromCycle(projectId, issue.cycle_id, issue.id);
      }
      if (cycleId) await planningApi.addIssueToCycle(projectId, cycleId, issue.id);
    },
    onSuccess: invalidate,
  });
}

export function useAddIssueComment(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => issuesApi.addComment(issueId!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.comments(issueId) }),
  });
}

export function useDeleteIssueComment(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => issuesApi.deleteComment(issueId!, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.comments(issueId) }),
  });
}

export function useAddIssueParticipant(identifier?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => issuesApi.addParticipant(identifier!, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.participants(identifier) }),
  });
}

export function useRemoveIssueParticipant(identifier?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => issuesApi.removeParticipant(identifier!, participantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.participants(identifier) }),
  });
}

export function useCreateIssueRelation(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetIdentifier, type }: { targetIdentifier: string; type: string }) => {
      const target = await issuesApi.get(targetIdentifier);
      return issuesApi.createRelation(issueId!, target.id, type);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.relations(issueId) }),
  });
}

export function useDeleteIssueRelation(issueId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issuesApi.deleteRelation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.relations(issueId) }),
  });
}

export function useScheduleIssue(identifier?: string | null) {
  const invalidate = useIssueInvalidation(identifier);
  return useMutation({
    mutationFn: ({ startsAt, durationHours }: { startsAt: string; durationHours: number }) => issuesApi.schedule(identifier!, startsAt, durationHours),
    onSuccess: invalidate,
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
