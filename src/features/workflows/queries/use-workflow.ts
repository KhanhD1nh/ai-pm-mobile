import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, projectKeys } from "@/features/projects/public";
import { workflowsApi } from "../api/workflows-api";
import { workflowKeys } from "../query-keys";

export function useWorkflow(projectId?: string | null) {
  const project = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });
  const statuses = useQuery({
    queryKey: workflowKeys.statuses(projectId),
    queryFn: () => workflowsApi.statuses(projectId!),
    enabled: !!projectId,
  });
  const ordered = useMemo(
    () => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position),
    [statuses.data],
  );

  return { project, statuses, ordered };
}
