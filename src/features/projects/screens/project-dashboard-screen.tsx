import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SectionHeader } from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { LoadingScreen, Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useProjectDashboard } from "../hooks/use-project-dashboard";

export default function ProjectHomeScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project, report, refresh } = useProjectDashboard(projectId);
  const pullRefresh = usePullToRefresh(refresh);

  if (project.isLoading) return <LoadingScreen />;
  if (!project.data)
    return (
      <Screen>
        <Text style={{ color: ui.colors.textSecondary }}>
          {language === "vi" ? "Không tìm thấy dự án." : "Project not found."}
        </Text>
      </Screen>
    );

  const data = project.data;
  const totals = report.data?.totals;
  const total = totals?.total_issues ?? data.issue_counter;
  const done = totals?.done ?? 0;
  const active = totals?.in_progress ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const go = (route: string) =>
    router.push(`/project/${projectId}/${route}` as never);
  const alerts = report.data?.alerts ?? [];
  const healthy = alerts.length === 0;

  return (
    <Screen
      edges={[]}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <View style={styles.overview}>
        <View style={styles.overviewTop}>
          <View style={styles.progressBlock}>
            <Text style={styles.eyebrow}>
              {language === "vi" ? "TIẾN ĐỘ" : "PROGRESS"}
            </Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.healthLine}>
            <View
              style={[styles.healthDot, !healthy && styles.healthDotWarning]}
            />
            <Text style={styles.healthText}>
              {healthy
                ? language === "vi"
                  ? "Đang ổn định"
                  : "On track"
                : language === "vi"
                  ? "Cần chú ý"
                  : "Needs attention"}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.summary}>
          {done} {language === "vi" ? "hoàn thành" : "done"} · {active}{" "}
          {language === "vi" ? "đang làm" : "active"} · {total}{" "}
          {language === "vi" ? "tổng" : "total"}
        </Text>
        {data.description ? (
          <Text style={styles.description}>{data.description}</Text>
        ) : null}
      </View>

      {alerts.length > 0 ? (
        <>
          <SectionHeader
            title={language === "vi" ? "Cần chú ý" : "Needs attention"}
          />
          <View style={styles.list}>
            {alerts.slice(0, 5).map((alert, index) => {
              const severe =
                alert.severity === "HIGH" || alert.severity === "CRITICAL";
              return (
                <View
                  key={`${alert.type}-${index}`}
                  style={[styles.alertRow, index > 0 && styles.divider]}
                >
                  <Ionicons
                    accessible={false}
                    name={severe ? "warning-outline" : "alert-circle-outline"}
                    size={18}
                    color={severe ? ui.colors.danger : ui.colors.warning}
                  />
                  <Text style={styles.alertLabel} numberOfLines={2}>
                    {alert.type.replaceAll("_", " ")}
                  </Text>
                  <Text style={styles.alertCount}>{alert.count}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionHeader
        title={language === "vi" ? "Trong dự án" : "Project tools"}
      />
      <View style={styles.list}>
        <ProjectLink
          icon="repeat-outline"
          label={language === "vi" ? "Chu kỳ / Sprint" : "Cycles / Sprints"}
          detail={
            language === "vi"
              ? "Lập kế hoạch theo giai đoạn"
              : "Plan focused iterations"
          }
          onPress={() => go("cycles")}
          ui={ui}
        />
        <ProjectLink
          icon="flag-outline"
          label={language === "vi" ? "Cột mốc" : "Milestones"}
          detail={
            language === "vi"
              ? "Mục tiêu và sức khỏe dự án"
              : "Goals and project health"
          }
          onPress={() => go("milestones")}
          ui={ui}
          bordered
        />
        <ProjectLink
          icon="document-text-outline"
          label="Wiki"
          detail={language === "vi" ? "Tài liệu và ghi chú" : "Docs and notes"}
          onPress={() => go("wiki")}
          ui={ui}
        />
        <ProjectLink
          icon="people-outline"
          label={language === "vi" ? "Thành viên" : "Members"}
          detail={
            language === "vi"
              ? "Những người trong dự án"
              : "People in this project"
          }
          onPress={() => go("members")}
          ui={ui}
          bordered
        />
        <ProjectLink
          icon="settings-outline"
          label={language === "vi" ? "Cài đặt" : "Settings"}
          detail={
            language === "vi"
              ? "Workflow và tích hợp"
              : "Workflow and integrations"
          }
          onPress={() => go("settings")}
          ui={ui}
          bordered
        />
      </View>
    </Screen>
  );
}

function ProjectLink({
  icon,
  label,
  detail,
  onPress,
  ui,
  bordered = false,
}: {
  icon: IoniconsIconName;
  label: string;
  detail: string;
  onPress: () => void;
  ui: AppTheme;
  bordered?: boolean;
}) {
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${detail}`}
      onPress={onPress}
      style={[styles.linkRow, bordered && styles.divider]}
    >
      <Ionicons
        accessible={false}
        name={icon}
        size={19}
        color={ui.colors.textSecondary}
      />
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{label}</Text>
        <Text style={styles.linkDetail}>{detail}</Text>
      </View>
      <Ionicons
        accessible={false}
        name="chevron-forward"
        size={16}
        color={ui.colors.textMuted}
      />
    </MotionPressable>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    overview: { gap: 11, paddingTop: 10, paddingBottom: 4 },
    overviewTop: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 14,
    },
    progressBlock: { flex: 1, minWidth: 0 },
    eyebrow: { color: ui.colors.textMuted, ...ui.typography.eyebrow },
    progressValue: {
      color: ui.colors.text,
      fontSize: 36,
      lineHeight: 42,
      fontWeight: "700",
      letterSpacing: -1.1,
      marginTop: 2,
    },
    healthLine: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    healthDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: ui.colors.success,
    },
    healthDotWarning: { backgroundColor: ui.colors.warning },
    healthText: { color: ui.colors.textSecondary, ...ui.typography.caption },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: ui.colors.surfaceRaised,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: ui.colors.accentStrong,
    },
    summary: { color: ui.colors.textMuted, ...ui.typography.caption },
    description: {
      color: ui.colors.textSecondary,
      fontSize: 15.5,
      lineHeight: 23,
      marginTop: 3,
    },
    list: { overflow: "hidden" },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    alertRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 9,
    },
    alertLabel: {
      flex: 1,
      color: ui.colors.text,
      ...ui.typography.body,
      textTransform: "capitalize",
    },
    alertCount: {
      color: ui.colors.textSecondary,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
    },
    linkRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    linkCopy: { flex: 1, minWidth: 0 },
    linkTitle: {
      color: ui.colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "500",
    },
    linkDetail: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
  });
