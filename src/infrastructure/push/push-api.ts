import { request } from "@/infrastructure/networking/api-client";
import type { NotificationDevice } from "@/shared/contracts";

export const pushApi = {
  registerDevice: (data: Record<string, unknown>) =>
    request<NotificationDevice>("/notifications/devices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  devices: () => request<NotificationDevice[]>("/notifications/devices"),
  disableDevice: (id: string) =>
    request<void>(`/notifications/devices/${id}`, { method: "DELETE" }),
};
