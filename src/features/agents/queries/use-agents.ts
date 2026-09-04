import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '../api/agents-api';
import { agentKeys } from '../query-keys';

export function useAgents() {
  return useQuery({ queryKey: agentKeys.list(), queryFn: agentsApi.list });
}

export function useAiActions() {
  return useQuery({ queryKey: agentKeys.actions(), queryFn: agentsApi.actions });
}
