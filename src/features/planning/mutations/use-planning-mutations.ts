import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isOfflineMutationReceipt } from "@/infrastructure/persistence/offline-mutation-queue";
import type { Cycle, Milestone } from "@/shared/contracts";
import { planningApi } from "../api/planning-api";
import { planningKeys } from "../query-keys";

export function useCreateCycle(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; startsAt: string; endsAt: string }) =>
      planningApi.createCycle(projectId!, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: planningKeys.cycles(projectId),
      }),
  });
}

export function useCreateMilestone(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      startDate?: string;
      targetDate: string;
    }) => planningApi.createMilestone({ projectId, ...input }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: planningKeys.milestones(projectId),
      }),
  });
}

export function useUpdateCycle(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cycleId,
      data,
    }: {
      cycleId: string;
      data: Record<string, unknown>;
    }) => planningApi.updateCycle(projectId!, cycleId, data),
    onMutate: async ({ cycleId, data }) => {
      const key = planningKeys.cycles(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cycle[]>(key);
      if (previous) {
        queryClient.setQueryData<Cycle[]>(
          key,
          previous.map((cycle) =>
            cycle.id !== cycleId
              ? cycle
              : {
                  ...cycle,
                  ...(typeof data.name === "string" ? { name: data.name } : {}),
                  ...(data.description === null ||
                  typeof data.description === "string"
                    ? { description: data.description as string | null }
                    : {}),
                  ...(typeof data.status === "string"
                    ? { status: data.status as Cycle["status"] }
                    : {}),
                  ...(typeof data.startsAt === "string"
                    ? { start_date: data.startsAt }
                    : {}),
                  ...(typeof data.endsAt === "string"
                    ? { end_date: data.endsAt }
                    : {}),
                },
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(
          planningKeys.cycles(projectId),
          context.previous,
        );
    },
    onSuccess: (result) => {
      if (!isOfflineMutationReceipt(result)) {
        queryClient.setQueryData<Cycle[]>(
          planningKeys.cycles(projectId),
          (current) =>
            current?.map((cycle) =>
              cycle.id === result.id ? { ...cycle, ...result } : cycle,
            ),
        );
      }
      return queryClient.invalidateQueries({
        queryKey: planningKeys.cycles(projectId),
      });
    },
  });
}

export function useUpdateMilestone(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: Record<string, unknown>;
    }) => planningApi.updateMilestone(milestoneId, data),
    onMutate: async ({ milestoneId, data }) => {
      const key = planningKeys.milestones(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Milestone[]>(key);
      if (previous) {
        queryClient.setQueryData<Milestone[]>(
          key,
          previous.map((milestone) =>
            milestone.id !== milestoneId
              ? milestone
              : {
                  ...milestone,
                  version: milestone.version + 1,
                  updated_at: new Date().toISOString(),
                  ...(typeof data.title === "string"
                    ? { title: data.title }
                    : {}),
                  ...(typeof data.status === "string"
                    ? { status: data.status as Milestone["status"] }
                    : {}),
                  ...(typeof data.targetDate === "string"
                    ? { target_date: data.targetDate }
                    : {}),
                },
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(
          planningKeys.milestones(projectId),
          context.previous,
        );
    },
    onSuccess: (result) => {
      if (!isOfflineMutationReceipt(result)) {
        queryClient.setQueryData<Milestone[]>(
          planningKeys.milestones(projectId),
          (current) =>
            current?.map((milestone) =>
              milestone.id === result.id ? result : milestone,
            ),
        );
      }
      return queryClient.invalidateQueries({
        queryKey: planningKeys.milestones(projectId),
      });
    },
  });
}

export function useUpdateMilestoneHealth(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      expectedVersion,
      healthStatus,
    }: {
      milestoneId: string;
      expectedVersion: number;
      healthStatus: string;
    }) =>
      planningApi.updateMilestoneHealth(
        milestoneId,
        expectedVersion,
        healthStatus,
      ),
    onSuccess: (result) => {
      queryClient.setQueryData<Milestone[]>(
        planningKeys.milestones(projectId),
        (current) =>
          current?.map((milestone) =>
            milestone.id === result.id ? result : milestone,
          ),
      );
      return queryClient.invalidateQueries({
        queryKey: planningKeys.milestones(projectId),
      });
    },
  });
}

export function useAddIssueToCycle(
  projectId?: string | null,
  cycleId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) =>
      planningApi.addIssueToCycle(projectId!, cycleId!, issueId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: planningKeys.cycles(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: planningKeys.cycleIssues(projectId, cycleId),
        }),
        queryClient.invalidateQueries({
          queryKey: planningKeys.backlogIssues(projectId),
        }),
      ]);
    },
  });
}

export function useRemoveIssueFromCycle(
  projectId?: string | null,
  cycleId?: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) =>
      planningApi.removeIssueFromCycle(projectId!, cycleId!, issueId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: planningKeys.cycles(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: planningKeys.cycleIssues(projectId, cycleId),
        }),
        queryClient.invalidateQueries({
          queryKey: planningKeys.backlogIssues(projectId),
        }),
      ]);
    },
  });
}
