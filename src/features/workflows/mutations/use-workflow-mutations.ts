import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../api/workflows-api';
import { workflowKeys } from '../query-keys';

function invalidateWorkflow(queryClient: ReturnType<typeof useQueryClient>, projectId?: string | null) {
  return queryClient.invalidateQueries({ queryKey: workflowKeys.statuses(projectId) });
}

export function useCreateWorkflowStatus(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => workflowsApi.createStatus(projectId!, data),
    onSuccess: () => invalidateWorkflow(queryClient, projectId),
  });
}

export function useUpdateWorkflowStatus(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => workflowsApi.updateStatus(projectId!, id, data),
    onSuccess: () => invalidateWorkflow(queryClient, projectId),
  });
}

export function useDeleteWorkflowStatus(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowsApi.deleteStatus(projectId!, id),
    onSuccess: () => invalidateWorkflow(queryClient, projectId),
  });
}
