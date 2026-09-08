import { Slot } from "expo-router";
import { ProjectWorkspaceShell } from "../components/project-workspace-shell";

export default function ProjectWorkspaceLayout() {
  return (
    <ProjectWorkspaceShell>
      <Slot />
    </ProjectWorkspaceShell>
  );
}
