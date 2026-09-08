import type { User } from "./auth";
import type { Cycle, Milestone } from "./planning";
import type { Tag, WorkflowStatus } from "./projects";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ParticipantRole =
  "ASSIGNEE" | "REVIEWER" | "NEXT_REVIEWER" | "OBSERVER";

export interface IssueParticipant {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  addedBy?: string | null;
  createdAt: string;
}

export interface IssueParticipantBrief {
  userId: string;
  name: string;
  role: string;
}

export interface Issue {
  id: string;
  project_id: string;
  organization_id?: string;
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

export interface IssueComment {
  id: string;
  issue_id: string;
  org_id?: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at?: string;
  author?: User | null;
}

export interface IssueRelation {
  id: string;
  source_issue_id: string;
  target_issue_id: string;
  type: "BLOCKS" | "RELATES_TO" | "DUPLICATES";
  created_at: string;
  target_issue?: Issue;
  source_issue?: Issue;
}
