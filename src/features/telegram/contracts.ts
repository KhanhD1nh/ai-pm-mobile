export interface TelegramPreferences {
  linked: boolean;
  telegramUserId: string | null;
  telegramUsername: string | null;
  telegramLinkedAt: string | null;
  notificationsEnabled: boolean;
  notifyAssigned: boolean;
  notifyDeadline: boolean;
  notifyStatusChange: boolean;
  notifyComments: boolean;
}

export type TelegramPreferenceKey =
  | 'notificationsEnabled'
  | 'notifyAssigned'
  | 'notifyDeadline'
  | 'notifyStatusChange'
  | 'notifyComments';

export interface TelegramLinkTokenResponse {
  token: string;
  pairCode?: string;
  linkUrl: string;
  expiresIn: number;
}

export interface TelegramAdminSettings {
  enabled: boolean;
  username: string | null;
  tokenMasked: string | null;
  hasToken: boolean;
}

export interface TelegramWebhookInfo {
  ok: boolean;
  url?: string | null;
  pendingUpdateCount?: number;
  lastErrorDate?: number | null;
  lastErrorMessage?: string | null;
  error?: string;
}
