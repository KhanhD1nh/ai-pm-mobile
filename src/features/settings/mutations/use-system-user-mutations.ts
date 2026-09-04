import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings-api';
import { settingsKeys } from '../query-keys';

function invalidateSystemUsers(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: settingsKeys.systemUsers() });
}

export function useCreateSystemUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.createSystemUser,
    onSuccess: () => invalidateSystemUsers(queryClient),
  });
}

export function useDeleteSystemUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deleteSystemUser,
    onSuccess: () => invalidateSystemUsers(queryClient),
  });
}
