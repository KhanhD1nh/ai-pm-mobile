import { request } from "@/infrastructure/networking/api-client";
import type {
  AiBudget,
  Organization,
  OrganizationMembership,
} from "@/shared/contracts";

export const organizationsApi = {
  list: () => request<Organization[]>("/orgs"),
  create: (slug: string, name: string) =>
    request<Organization>("/orgs", {
      method: "POST",
      body: JSON.stringify({ slug, name }),
    }),
  update: (orgId: string, name: string) =>
    request<Organization>(`/orgs/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  members: (orgId: string) =>
    request<OrganizationMembership[]>(`/orgs/${orgId}/members`),
  addMember: (orgId: string, email: string, role: string) =>
    request<OrganizationMembership>(`/orgs/${orgId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  updateMember: (orgId: string, memberId: string, role: string) =>
    request<OrganizationMembership>(`/orgs/${orgId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  removeMember: (orgId: string, memberId: string) =>
    request<void>(`/orgs/${orgId}/members/${memberId}`, { method: "DELETE" }),
  aiBudget: (orgId: string) => request<AiBudget>(`/orgs/${orgId}/ai-budget`),
  updateAiBudget: (
    orgId: string,
    data: Partial<
      Pick<AiBudget, "monthlyUsdLimit" | "alertThresholdPct" | "resetDay">
    >,
  ) =>
    request<AiBudget>(`/orgs/${orgId}/ai-budget`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
