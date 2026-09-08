import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "../api/organizations-api";
import { organizationKeys } from "../query-keys";

export function useOrganizationMembers(orgId?: string | null) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationsApi.members(orgId!),
    enabled: !!orgId,
  });
}

export function useAiBudget(orgId?: string | null) {
  return useQuery({
    queryKey: organizationKeys.budget(orgId),
    queryFn: () => organizationsApi.aiBudget(orgId!),
    enabled: !!orgId,
  });
}
