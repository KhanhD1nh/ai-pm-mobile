import { request } from "@/infrastructure/networking/api-client";
import type {
  TelegramAdminSettings,
  TelegramLinkTokenResponse,
  TelegramPreferences,
  TelegramPreferenceKey,
  TelegramWebhookInfo,
} from "../contracts";

export const telegramApi = {
  getPreferences: () => request<TelegramPreferences>("/users/me/telegram"),
  createLinkToken: () =>
    request<TelegramLinkTokenResponse>("/users/me/telegram/link-token", {
      method: "POST",
    }),
  updatePreferences: (
    data: Partial<Pick<TelegramPreferences, TelegramPreferenceKey>> & {
      unlink?: boolean;
    },
  ) =>
    request<TelegramPreferences>("/users/me/telegram", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getAdminSettings: () =>
    request<TelegramAdminSettings>("/system/settings/telegram"),
  updateAdminSettings: (data: {
    token?: string;
    username?: string;
    enabled?: boolean;
  }) =>
    request<TelegramAdminSettings>("/system/settings/telegram", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  testBot: (token?: string) =>
    request<{
      ok: boolean;
      bot?: { id: number; username: string; first_name: string };
      error?: string;
    }>("/system/settings/telegram/test", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  getWebhookInfo: () =>
    request<TelegramWebhookInfo>("/system/settings/telegram/webhook"),
  registerWebhook: (url?: string) =>
    request<{
      ok: boolean;
      url?: string;
      description?: string;
      error?: string;
    }>("/system/settings/telegram/webhook", {
      method: "POST",
      body: JSON.stringify(url ? { url } : {}),
    }),
};
