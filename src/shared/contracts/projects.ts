export type ProjectMemberRole = 'LEAD' | 'MEMBER' | 'VIEWER';
export type StatusCategory = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELED' | 'REJECTED';

export interface Project {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description?: string | null;
  telegram_channel_id?: string | null;
  webhook_url?: string | null;
  issue_counter: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStatus {
  id: string;
  workflow_id: string;
  name: string;
  category: StatusCategory;
  position: number;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt: string;
}

export interface DailyReport {
  project_key: string;
  snapshot_date: string;
  computed_at: string | null;
  refreshed: boolean;
  totals?: { total_issues: number; done: number; in_review: number; todo: number; in_progress: number; backlog: number; archived: number };
  by_priority?: Record<string, number>;
  today?: { completions: number; new_tasks: number; net_change: number } | null;
  stale_tasks?: { id: string; identifier: string; title: string; category: string; assignee_id?: string | null; updated_at: string; hours_since_update: number }[];
  alerts?: { type: string; severity: string; count: number }[];
}
