import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '../api/agents-api';
import { agentKeys } from '../query-keys';

export function useAgents(orgId?: string | null) {
  return useQuery({ queryKey: agentKeys.list(orgId), queryFn: agentsApi.list, enabled: !!orgId });
}

export function useAiActions(orgId?: string | null) {
  return useQuery({ queryKey: agentKeys.actions(orgId), queryFn: agentsApi.actions, enabled: !!orgId });
}
