export interface NotificationItem {
  id: string;
  org_id: string;
  user_id: string;
  project_id?: string | null;
  type: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title?: string | null;
  body?: string | null;
  read: boolean;
  read_at?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface NotificationDevice {
  id: string;
  platform: string;
  push_provider: string;
  device_name?: string | null;
  app_version?: string | null;
  enabled: boolean;
  last_seen_at: string;
}
