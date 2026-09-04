export interface Cycle {
  id: string;
  project_id: string;
  number: number;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  created_at: string;
  issue_count?: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  target_date: string;
  status: 'OPEN' | 'COMPLETED' | 'CANCELED';
  health_status: string;
  health_updated_at?: string | null;
  last_evaluated_by: string;
  version: number;
  created_at: string;
  updated_at: string;
}
