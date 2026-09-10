import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/providers/auth-provider";
import {
  ContentTabs,
  GlassIconButton,
  HeaderBackButton,
} from "@/shared/components/ui/mobile";
import { CrossfadeSwap } from "@/shared/components/ui/motion";
import { LoadingScreen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useProject } from "../queries/use-projects";

type ProjectTab = "overview" | "tasks" | "schedule";

function resolveTab(pathname: string, projectId: string): ProjectTab | null {
  const path = pathname.replace(/\/+$/, "");
  const base = `/project/${projectId}`;
  if (path === base) return "overview";
  if (path === `${base}/board`) return "tasks";
  if (path === `${base}/planning`) return "schedule";
  return null;
}

export function ProjectWorkspaceShell({ children }: PropsWithChildren) {
  const { projectId = "" } = useLocalSearchParams<{ projectId: string }>();
  const pathname = usePathname();
  const { theme: ui, language } = useAppPreferences();
  const { orgId, selectOrganization } = useAuth();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const project = useProject(projectId);
  const resolvedTab = resolveTab(pathname, projectId);
  const [tabSnapshot, setTabSnapshot] = useState<{
    pathname: string;
    activeTab: ProjectTab;
  }>(() => ({
    pathname,
    activeTab: resolvedTab ?? "overview",
  }));

  // usePathname follows the globally selected route, including while this
  // workspace screen is still mounted underneath a native push transition.
  // Only commit paths that belong to this workspace. When a sibling/detail
  // route becomes globally active, keep the outgoing screen geometry intact.
  if (resolvedTab && pathname !== tabSnapshot.pathname) {
    setTabSnapshot({ pathname, activeTab: resolvedTab });
  }
  const activeTab = resolvedTab ?? tabSnapshot.activeTab;

  useEffect(() => {
    const targetOrgId = project.data?.organization_id;
    if (targetOrgId && targetOrgId !== orgId)
      void selectOrganization(targetOrgId);
  }, [orgId, project.data?.organization_id, selectOrganization]);

  if (project.isLoading && !project.data) return <LoadingScreen />;
  if (project.data?.organization_id && project.data.organization_id !== orgId)
    return <LoadingScreen />;

  const data = project.data;
  const selectTab = (next: string) => {
    if (next === activeTab || !projectId) return;
    if (next === "overview") {
      router.replace({
        pathname: "/project/[projectId]",
        params: { projectId },
      });
      return;
    }
    if (next === "tasks") {
      router.replace(`/project/${projectId}/board` as never);
      return;
    }
    if (next === "schedule")
      router.replace(`/project/${projectId}/planning` as never);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.chrome}>
        <View style={styles.appBar}>
          <HeaderBackButton onPress={() => router.back()} />

          <View style={styles.projectIdentity}>
            <View style={styles.projectCopy}>
              <Text style={styles.projectName} numberOfLines={1}>
                {data?.name ?? "Project"}
              </Text>
              <Text style={styles.projectMeta}>{data?.key ?? ""}</Text>
            </View>
          </View>

          <GlassIconButton
            icon="search-outline"
            label={language === "vi" ? "Tìm kiếm" : "Search"}
            onPress={() => router.push("/search")}
          />
        </View>

        <ContentTabs
          value={activeTab}
          onChange={selectTab}
          items={[
            {
              key: "overview",
              label: language === "vi" ? "Tổng quan" : "Overview",
            },
            { key: "tasks", label: language === "vi" ? "Công việc" : "Tasks" },
            { key: "schedule", label: language === "vi" ? "Lịch" : "Schedule" },
          ]}
        />
      </SafeAreaView>

      <CrossfadeSwap transitionKey={activeTab} style={styles.content}>
        {children}
      </CrossfadeSwap>
    </View>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.colors.bg },
    chrome: {
      zIndex: 2,
      backgroundColor: ui.colors.bg,
      paddingHorizontal: ui.header.horizontalInset,
      paddingBottom: 0,
      gap: 6,
    },
    appBar: {
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: ui.header.actionSize + ui.header.verticalInset * 2,
      paddingVertical: ui.header.verticalInset,
    },
    projectIdentity: { flex: 1, minWidth: 0, justifyContent: "center" },
    projectCopy: { flex: 1, minWidth: 0 },
    projectName: {
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      fontSize: 16,
    },
    projectMeta: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 11,
      marginTop: 1,
    },
    content: { flex: 1, minHeight: 0 },
  });
