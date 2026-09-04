import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planningApi } from '../api/planning-api';
import { planningKeys } from '../query-keys';

export function useCreateCycle(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; startsAt: string; endsAt: string }) => planningApi.createCycle(projectId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.cycles(projectId) }),
  });
}

export function useCreateMilestone(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; startDate?: string; targetDate: string }) => planningApi.createMilestone({ projectId, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planningKeys.milestones(projectId) }),
  });
}
