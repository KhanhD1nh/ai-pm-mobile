import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '../api/agents-api';
import { agentKeys } from '../query-keys';

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; provider: string; autonomyLevel?: string }) => agentsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agentKeys.list() }),
  });
}

export function useToggleAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => agentsApi.update(id, { isActive: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agentKeys.list() }),
  });
}

export function useRevertAiAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentsApi.revert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agentKeys.actions() }),
  });
}
