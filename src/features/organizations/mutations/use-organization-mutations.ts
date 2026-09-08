import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AiBudget } from "@/shared/contracts";
import { organizationsApi } from "../api/organizations-api";
import { organizationKeys } from "../query-keys";

export function useUpdateOrganization(orgId?: string | null) {
  return useMutation({
    mutationFn: (name: string) => organizationsApi.update(orgId!, name),
  });
}

export function useAddOrganizationMember(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      organizationsApi.addMember(orgId!, email, role),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      }),
  });
}

export function useUpdateOrganizationMember(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      organizationsApi.updateMember(orgId!, id, role),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      }),
  });
}

export function useRemoveOrganizationMember(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationsApi.removeMember(orgId!, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      }),
  });
}

export function useUpdateAiBudget(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<AiBudget, "monthlyUsdLimit" | "alertThresholdPct" | "resetDay">
      >,
    ) => organizationsApi.updateAiBudget(orgId!, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.budget(orgId),
      }),
  });
}
