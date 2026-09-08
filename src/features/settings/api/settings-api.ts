import { request } from "@/infrastructure/networking/api-client";
import type { User } from "@/shared/contracts";

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isSystemOwner?: boolean;
  createdAt?: string;
  workspaces?: { orgId: string; orgName: string; role: string }[];
}

export const settingsApi = {
  users: (q?: string) =>
    request<User[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  systemUsers: () => request<SystemUser[]>("/users/system"),
  createSystemUser: (data: {
    name: string;
    email: string;
    password: string;
    orgId?: string;
    role?: string;
  }) =>
    request<User>("/users/system", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSystemUser: (userId: string) =>
    request<void>(`/users/system/${userId}`, { method: "DELETE" }),
  assignUserWorkspace: (userId: string, orgId: string, role: string) =>
    request(`/users/system/${userId}/workspaces`, {
      method: "POST",
      body: JSON.stringify({ orgId, role }),
    }),
  removeUserWorkspace: (userId: string, orgId: string) =>
    request<void>(`/users/system/${userId}/workspaces/${orgId}`, {
      method: "DELETE",
    }),
  updateMe: (data: Record<string, unknown>) =>
    request<User>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
