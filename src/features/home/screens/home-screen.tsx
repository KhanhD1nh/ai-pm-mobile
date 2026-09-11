import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { WorkspaceSwitcher } from "@/features/organizations/public";
import {
  IssueCompletionButton,
  IssueQuickActionsSheet,
} from "@/features/issues/public";
import type { Issue } from "@/shared/contracts";
import { StyleSheet, Text, View } from "react-native";
import { GlassIconButton, SectionHeader } from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useAuth } from "@/providers/auth-provider";
import { updateAiPmFocusWidget } from "@/infrastructure/widgets/ai-pm-widget-service";
import { useHomeDashboard } from "../hooks/use-home-dashboard";

export default function HomeScreen() {
  const { user, orgId } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [quickIssue, setQuickIssue] = useState<Issue | null>(null);
  const { projects, issues, unread, overdue, inProgress, refresh } =
    useHomeDashboard(orgId, user?.id);
  const pullRefresh = usePullToRefresh(refresh);
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || (language === "vi" ? "bạn" : "there");
  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const focusItems = [
    ...overdue,
    ...inProgress.filter(
      (item) => !overdue.some((overdueItem) => overdueItem.id === item.id),
    ),
  ].slice(0, 6);

  const focusSentence =
    overdue.length > 0
      ? language === "vi"
        ? `${overdue.length} việc quá hạn cần xử lý trước.`
        : `${overdue.length} overdue ${overdue.length === 1 ? "task needs" : "tasks need"} attention first.`
      : focusItems.length > 0
        ? language === "vi"
          ? `${focusItems.length} việc đang chờ bạn tiếp tục.`
          : `${focusItems.length} ${focusItems.length === 1 ? "task is" : "tasks are"} ready to continue.`
        : language === "vi"
          ? "Không có việc gấp lúc này."
          : "Nothing urgent right now.";

  useEffect(() => {
    if (!user || !orgId || !issues.data || projects.data === undefined) return;

    const actionable = issues.data.filter(
      (issue) =>
        !["DONE", "CANCELED", "REJECTED"].includes(
          issue.status?.category ?? "",
        ),
    );
    const focusIssue = overdue[0] ?? inProgress[0] ?? actionable[0];
    const now = new Date();

    void updateAiPmFocusWidget({
      title: "AI-PM",
      primaryMetric: String(overdue.length),
      primaryMetricLabel: language === "vi" ? "quá hạn" : "overdue",
      secondaryMetric: String(inProgress.length),
      secondaryMetricLabel: language === "vi" ? "đang làm" : "in progress",
      focusIdentifier: focusIssue?.identifier ?? "✓",
      focusTitle:
        focusIssue?.title ??
        (language === "vi"
          ? "Không có việc cần chú ý"
          : "Nothing needs attention"),
      focusMeta: focusIssue
        ? [
            focusIssue.status?.name,
            focusIssue.due_date
              ? new Date(
                  `${focusIssue.due_date.slice(0, 10)}T00:00:00`,
                ).toLocaleDateString(locale)
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ")
        : `${unread.data?.unread ?? 0} ${language === "vi" ? "thông báo chưa đọc" : "unread notifications"}`,
      primaryUrl: focusIssue
        ? `aipm://issue/${focusIssue.identifier}`
        : "aipm://my-work",
      updatedLabel: now.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }, [
    inProgress,
    issues.data,
    issues.dataUpdatedAt,
    language,
    locale,
    orgId,
    overdue,
    projects.data,
    unread.data?.unread,
    user,
  ]);

  return (
    <Screen
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <View style={styles.topBar}>
        <WorkspaceSwitcher />
        <GlassIconButton
          icon="search-outline"
          label={language === "vi" ? "Tìm kiếm" : "Search"}
          onPress={() => router.push("/search")}
        />
      </View>

      <View style={styles.hero}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.heroTitle}>
          {language === "vi" ? `Chào ${firstName}` : `Hi ${firstName}`}
        </Text>
        <Text style={styles.heroSubtitle}>{focusSentence}</Text>
      </View>

      <SectionHeader
        title={language === "vi" ? "Việc cần làm" : "Next up"}
        right={
          focusItems.length > 0 ? (
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                language === "vi" ? "Xem tất cả công việc" : "View all work"
              }
              onPress={() => router.push("/my-work")}
              style={styles.sectionAction}
            >
              <Text style={styles.link}>
                {language === "vi" ? "Tất cả" : "All"}
              </Text>
            </MotionPressable>
          ) : undefined
        }
      />

      <View style={styles.list}>
        {focusItems.length === 0 ? (
          <View style={styles.emptyRow}>
            <View style={styles.emptyIcon}>
              <Ionicons
                accessible={false}
                name="checkmark"
                size={18}
                color={ui.colors.success}
              />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>
                {language === "vi"
                  ? "Bạn đã xử lý hết việc cần chú ý"
                  : "You are caught up"}
              </Text>
              <Text style={styles.rowMeta}>
                {language === "vi"
                  ? "Các công việc mới sẽ xuất hiện ở đây."
                  : "New work that needs attention will appear here."}
              </Text>
            </View>
          </View>
        ) : (
          focusItems.map((issue, index) => {
            const isOverdue = overdue.some((item) => item.id === issue.id);
            return (
              <MotionPressable
                key={issue.id}
                accessibilityRole="button"
                accessibilityLabel={`${issue.identifier}, ${issue.title}${issue.status?.name ? `, ${issue.status.name}` : ""}`}
                onPress={() =>
                  router.push({
                    pathname: "/issue/[identifier]",
                    params: { identifier: issue.identifier },
                  })
                }
                onLongPress={() => setQuickIssue(issue)}
                delayLongPress={280}
                style={[styles.workRow, index > 0 && styles.divider]}
              >
                <IssueCompletionButton issue={issue} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {issue.title}
                  </Text>
                  <View style={styles.metaLine}>
                    <Text style={styles.identifier}>{issue.identifier}</Text>
                    {issue.status?.name ? (
                      <>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.rowMeta}>{issue.status.name}</Text>
                      </>
                    ) : null}
                    {issue.due_date ? (
                      <>
                        <Text style={styles.metaDot}>·</Text>
                        <Text
                          style={[
                            styles.rowMeta,
                            isOverdue && styles.dangerText,
                          ]}
                        >
                          {new Date(issue.due_date).toLocaleDateString(locale)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <Ionicons
                  accessible={false}
                  name="chevron-forward"
                  size={16}
                  color={ui.colors.textMuted}
                />
              </MotionPressable>
            );
          })
        )}
      </View>

      <SectionHeader
        title={language === "vi" ? "Dự án gần đây" : "Recent projects"}
        right={
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              language === "vi" ? "Xem tất cả dự án" : "View all projects"
            }
            onPress={() => router.push("/projects")}
            style={styles.sectionAction}
          >
            <Text style={styles.link}>
              {language === "vi" ? "Tất cả" : "All"}
            </Text>
          </MotionPressable>
        }
      />

      <View style={styles.list}>
        {(projects.data ?? []).slice(0, 4).map((project, index) => (
          <MotionPressable
            key={project.id}
            accessibilityRole="button"
            accessibilityLabel={`${project.name}, ${project.key}, ${project.issue_counter} ${language === "vi" ? "công việc" : "tasks"}`}
            onPress={() =>
              router.push({
                pathname: "/project/[projectId]",
                params: { projectId: project.id },
              })
            }
            style={[styles.projectRow, index > 0 && styles.divider]}
          >
            <View style={styles.projectDot} />
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {project.name}
              </Text>
              <Text style={styles.rowMeta}>
                {project.key} · {project.issue_counter}{" "}
                {language === "vi" ? "công việc" : "tasks"}
              </Text>
            </View>
            <Ionicons
              accessible={false}
              name="chevron-forward"
              size={16}
              color={ui.colors.textMuted}
            />
          </MotionPressable>
        ))}
      </View>

      <IssueQuickActionsSheet
        issue={quickIssue}
        onClose={() => setQuickIssue(null)}
      />
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    topBar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    hero: { paddingTop: 12, paddingBottom: 10 },
    date: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      textTransform: "capitalize",
    },
    heroTitle: {
      color: ui.colors.text,
      ...ui.typography.screenTitle,
      marginTop: 3,
    },
    heroSubtitle: {
      color: ui.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 5,
      maxWidth: 420,
    },
    sectionAction: {
      minHeight: 44,
      minWidth: 44,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: -8,
    },
    link: {
      color: ui.colors.accentStrong,
      ...ui.typography.bodyStrong,
      fontSize: 13,
    },
    list: { overflow: "hidden" },
    workRow: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
    },
    projectRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 5,
    },
    projectDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: ui.colors.accentStrong,
    },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: {
      color: ui.colors.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "500",
    },
    rowMeta: { color: ui.colors.textMuted, ...ui.typography.caption },
    metaLine: {
      minHeight: 18,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 3,
    },
    identifier: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    metaDot: { color: ui.colors.textMuted, fontSize: 12 },
    dangerText: { color: ui.colors.danger },
    emptyRow: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    emptyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.successSoft,
    },
  });
