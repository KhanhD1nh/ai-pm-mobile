export interface Agent {
  id: string;
  organization_id?: string | null;
  name: string;
  provider: string;
  created_by_user_id?: string | null;
  autonomy_level: string;
  is_active: boolean;
  last_seen_at?: string | null;
  created_at: string;
  scopes?: string[];
  token?: string;
}

export interface AiAction {
  id: string;
  agent_id: string;
  agent_name?: string;
  action_type: string;
  target_type: string;
  target_id: string;
  target_identifier?: string | null;
  payload: Record<string, unknown>;
  execution_mode: string;
  approved_by_user_id?: string | null;
  status: string;
  trace_id: string;
  created_at: string;
}
