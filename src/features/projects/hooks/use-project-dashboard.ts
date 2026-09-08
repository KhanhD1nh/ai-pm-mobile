import { useProject, useProjectReport } from "../queries/use-projects";

export function useProjectDashboard(projectId?: string | null) {
  const project = useProject(projectId);
  const report = useProjectReport(projectId, project.data?.key);

  return {
    project,
    report,
    refreshing: project.isRefetching || report.isRefetching,
    refresh: async () => {
      await Promise.all([project.refetch(), report.refetch()]);
    },
  };
}
