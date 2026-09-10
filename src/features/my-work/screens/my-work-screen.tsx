import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  IssueCompletionButton,
  IssueQuickActionsSheet,
} from "@/features/issues/public";
import type { Issue } from "@/shared/contracts";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { EmptyState, Screen } from "@/shared/components/ui/screen";
import { MotionPressable } from "@/shared/components/ui/motion";
import { priorityColor, type AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useAuth } from "@/providers/auth-provider";
import { useMyWork } from "../hooks/use-my-work";

export default function MyWorkScreen() {
  const { user, orgId } = useAuth();
  const { theme: ui, language, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [quickIssue, setQuickIssue] = useState<Issue | null>(null);
  const { query, issues, sections } = useMyWork(orgId, user?.id);
  const pullRefresh = usePullToRefresh(() => query.refetch());
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const sectionData = useMemo(
    () =>
      sections
        .filter(([, list]) => list.length > 0)
        .map(([title, list]) => ({ title, data: list })),
    [sections],
  );

  return (
    <Screen
      chrome="stack"
      title={t("myWork.title")}
      subtitle={
        issues.length > 0
          ? `${issues.length} ${t("myWork.workCount")}`
          : undefined
      }
      scroll={false}
    >
      <SectionList
        sections={sectionData}
        keyExtractor={(issue) => issue.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshing={pullRefresh.refreshing}
        onRefresh={pullRefresh.onRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title={t("myWork.empty")} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.count}>{section.data.length}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item: issue }) => (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${issue.identifier}, ${issue.title}`}
            onPress={() =>
              router.push({
                pathname: "/issue/[identifier]",
                params: { identifier: issue.identifier },
              })
            }
            onLongPress={() => setQuickIssue(issue)}
            delayLongPress={280}
            style={styles.item}
          >
            <IssueCompletionButton issue={issue} />
            <View style={styles.copy}>
              <View style={styles.topRow}>
                <Text style={styles.identifier}>{issue.identifier}</Text>
                {issue.priority !== "MEDIUM" ? (
                  <Text
                    style={[
                      styles.priority,
                      { color: priorityColor(ui, issue.priority) },
                    ]}
                  >
                    {issue.priority}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {issue.title}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.status}>{issue.status?.name ?? "-"}</Text>
                {issue.due_date ? (
                  <>
                    <Text style={styles.metaDot}>·</Text>
                    <Ionicons
                      accessible={false}
                      name="calendar-outline"
                      size={12}
                      color={ui.colors.textMuted}
                    />
                    <Text style={styles.metaText}>
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
        )}
      />
      <IssueQuickActionsSheet
        issue={quickIssue}
        onClose={() => setQuickIssue(null)}
      />
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    listContent: { paddingBottom: 24 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      paddingHorizontal: 1,
      paddingTop: 14,
      paddingBottom: 6,
      backgroundColor: ui.colors.bg,
    },
    sectionTitle: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 18,
    },
    count: { color: ui.colors.textMuted, ...ui.typography.caption },
    item: {
      minHeight: 84,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    statusMarker: { width: 3, height: 44, borderRadius: 2 },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    identifier: {
      color: ui.colors.textMuted,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: "600",
    },
    priority: {
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    title: {
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      fontSize: 15.5,
    },
    meta: { flexDirection: "row", alignItems: "center", gap: 5 },
    status: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontSize: 11.5,
    },
    metaText: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 11.5,
    },
    metaDot: { color: ui.colors.textMuted, fontSize: 12 },
  });
