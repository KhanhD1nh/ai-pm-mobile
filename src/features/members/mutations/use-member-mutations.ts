import { useMutation, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "../api/members-api";
import { memberKeys } from "../query-keys";

function invalidateMembers(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId?: string | null,
) {
  return queryClient.invalidateQueries({
    queryKey: memberKeys.project(projectId),
  });
}

export function useAddProjectMember(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      membersApi.add(projectId!, userId, role),
    onSuccess: () => invalidateMembers(queryClient, projectId),
  });
}

export function useAddProjectMembersBatch(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, role }: { userIds: string[]; role: string }) =>
      membersApi.addBatch(projectId!, userIds, role),
    onSuccess: () => invalidateMembers(queryClient, projectId),
  });
}

export function useUpdateProjectMemberRole(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      membersApi.updateRole(projectId!, userId, role),
    onSuccess: () => invalidateMembers(queryClient, projectId),
  });
}

export function useRemoveProjectMember(projectId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(projectId!, userId),
    onSuccess: () => invalidateMembers(queryClient, projectId),
  });
}
