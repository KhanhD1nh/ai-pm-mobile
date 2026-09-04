export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ProjectMemberRole = 'LEAD' | 'MEMBER' | 'VIEWER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type StatusCategory = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELED' | 'REJECTED';
export type ParticipantRole = 'ASSIGNEE' | 'REVIEWER' | 'NEXT_REVIEWER' | 'OBSERVER';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  is_system_owner?: boolean;
  isSystemOwner?: boolean;
  created_at?: string;
}

export interface AuthResponse { user: User; token: string }

export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
  role?: OrganizationRole;
}

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

export interface Tag { id: string; project_id: string; name: string; color: string; created_at: string }
export interface Cycle { id: string; project_id: string; number: number; name: string; description?: string | null; start_date: string; end_date: string; status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'; created_at: string; issue_count?: number }
export interface Milestone { id: string; project_id: string; title: string; description?: string | null; start_date?: string | null; target_date: string; status: 'OPEN' | 'COMPLETED' | 'CANCELED'; health_status: string; health_updated_at?: string | null; last_evaluated_by: string; version: number; created_at: string; updated_at: string }

export interface IssueParticipant { id: string; userId: string; name: string; email: string; role: string; addedBy?: string | null; createdAt: string }
export interface IssueParticipantBrief { userId: string; name: string; role: string }

export interface Issue {
  id: string;
  project_id: string;
  number: number;
  identifier: string;
  title: string;
  description?: string | null;
  status_id: string;
  priority: Priority;
  creator_id: string;
  assignee_id?: string | null;
  claimed_at?: string | null;
  milestone_id?: string | null;
  cycle_id?: string | null;
  parent_id?: string | null;
  due_date?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  focus_hours?: number | string | null;
  cost?: number | string | null;
  is_archived: boolean;
  archived_at?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  status?: WorkflowStatus;
  assignee?: User | null;
  creator?: User;
  milestone?: Milestone;
  cycle?: Cycle;
  participants?: IssueParticipantBrief[];
  tags?: Tag[];
}

export interface IssueComment { id: string; issue_id: string; org_id?: string; author_id: string; body: string; created_at: string; updated_at?: string; author?: User | null }
export interface IssueRelation { id: string; source_issue_id: string; target_issue_id: string; type: 'BLOCKS' | 'RELATES_TO' | 'DUPLICATES'; created_at: string; target_issue?: Issue; source_issue?: Issue }
export interface WikiPage { id: string; project_id: string; slug: string; title: string; summary?: string | null; content: string; format: string; version: number; created_by?: string | null; created_at: string; updated_at: string }
export interface ProjectMember { id: string; name: string; email: string; avatarUrl?: string | null; role: string; joinedAt: string }
export interface Agent { id: string; organization_id?: string | null; name: string; provider: string; created_by_user_id?: string | null; autonomy_level: string; is_active: boolean; last_seen_at?: string | null; created_at: string; scopes?: string[]; token?: string }
export interface AiAction { id: string; agent_id: string; agent_name?: string; action_type: string; target_type: string; target_id: string; target_identifier?: string | null; payload: Record<string, unknown>; execution_mode: string; approved_by_user_id?: string | null; status: string; trace_id: string; created_at: string }

export interface NotificationItem {
  id: string;
  org_id: string;
  user_id: string;
  project_id?: string | null;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title?: string | null;
  body?: string | null;
  read: boolean;
  read_at?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DailyReport {
  project_key: string;
  snapshot_date: string;
  computed_at: string | null;
  refreshed: boolean;
  totals?: { total_issues: number; done: number; in_review: number; todo: number; in_progress: number; backlog: number; archived: number };
  by_priority?: Record<string, number>;
  today?: { completions: number; new_tasks: number; net_change: number } | null;
  stale_tasks?: Array<{ id: string; identifier: string; title: string; category: string; assignee_id?: string | null; updated_at: string; hours_since_update: number }>;
  alerts?: Array<{ type: string; severity: string; count: number }>;
}
