import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  HeaderBackButton,
  SearchBar,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { LiquidGlassSurface } from "@/shared/components/ui/glass";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useAuth } from "@/providers/auth-provider";
import type { Issue, Project } from "@/shared/contracts";
import { IssueQuickActionsSheet } from "@/features/issues/public";
import { useGlobalSearch } from "../hooks/use-global-search";

type SearchItem =
  { kind: "project"; project: Project } | { kind: "issue"; issue: Issue };

type SearchSection = {
  key: "suggested" | "projects" | "issues";
  title: string;
  data: SearchItem[];
};

export default function SearchScreen() {
  const { orgId } = useAuth();
  const {
    theme: ui,
    language,
    themePreference,
    resolvedTheme,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [quickIssue, setQuickIssue] = useState<Issue | null>(null);
  const [query, setQuery] = useState("");
  const result = useGlobalSearch(orgId, query);
  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length >= 2;
  const total = result.projects.length + result.issues.length;

  const sections = useMemo<SearchSection[]>(() => {
    if (!hasQuery) {
      if (result.suggestedProjects.length === 0) return [];
      return [
        {
          key: "suggested",
          title: language === "vi" ? "Gợi ý" : "Suggested",
          data: result.suggestedProjects.map((project) => ({
            kind: "project" as const,
            project,
          })),
        },
      ];
    }

    const next: SearchSection[] = [];
    if (result.projects.length > 0) {
      next.push({
        key: "projects",
        title: language === "vi" ? "Dự án" : "Projects",
        data: result.projects.map((project) => ({
          kind: "project" as const,
          project,
        })),
      });
    }
    if (result.issues.length > 0) {
      next.push({
        key: "issues",
        title: language === "vi" ? "Công việc" : "Issues",
        data: result.issues.map((issue) => ({ kind: "issue" as const, issue })),
      });
    }
    return next;
  }, [
    hasQuery,
    language,
    result.issues,
    result.projects,
    result.suggestedProjects,
  ]);

  const closeSearch = () => {
    Keyboard.dismiss();
    router.back();
  };

  const openProject = (projectId: string) => {
    Keyboard.dismiss();
    router.push({ pathname: "/project/[projectId]", params: { projectId } });
  };

  const openIssue = (identifier: string) => {
    Keyboard.dismiss();
    router.push({ pathname: "/issue/[identifier]", params: { identifier } });
  };

  const searchInput = (
    <SearchBar
      autoFocus={Platform.OS !== "web"}
      autoCapitalize="none"
      autoCorrect={false}
      blurOnSubmit={false}
      accessibilityLabel={
        language === "vi" ? "Tìm kiếm trong AI-PM" : "Search AI-PM"
      }
      keyboardAppearance={resolvedTheme === "dark" ? "dark" : "light"}
      placeholder={
        language === "vi" ? "Tìm issue, dự án…" : "Search issues, projects…"
      }
      returnKeyType="search"
      value={query}
      onChangeText={setQuery}
      containerStyle={
        Platform.OS === "ios"
          ? styles.floatingSearchField
          : styles.inlineSearchField
      }
    />
  );

  const iosSearchDock =
    Platform.OS === "ios" ? (
      <KeyboardAvoidingView
        behavior="padding"
        pointerEvents="box-none"
        style={styles.keyboardDock}
      >
        <View pointerEvents="box-none" style={styles.searchDock}>
          <LiquidGlassSurface
            variant="regular"
            colorScheme={themePreference === "system" ? "auto" : resolvedTheme}
            borderRadius={28}
            style={styles.searchGlass}
            fallbackStyle={styles.searchGlassFallback}
          >
            {searchInput}
          </LiquidGlassSurface>
          <HeaderBackButton
            kind="close"
            label={language === "vi" ? "Đóng tìm kiếm" : "Close search"}
            onPress={closeSearch}
          />
        </View>
      </KeyboardAvoidingView>
    ) : undefined;

  const renderEmpty = () => {
    if (normalizedQuery.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              accessible={false}
              name="search-outline"
              size={22}
              color={ui.colors.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {language === "vi" ? "Tìm trong AI-PM" : "Search AI-PM"}
          </Text>
          <Text style={styles.emptyBody}>
            {language === "vi"
              ? "Tìm theo tên dự án, tên công việc hoặc mã issue."
              : "Search by project name, task title, or issue identifier."}
          </Text>
        </View>
      );
    }

    if (!hasQuery) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {language === "vi"
              ? "Nhập thêm 1 ký tự"
              : "Type one more character"}
          </Text>
          <Text style={styles.emptyBody}>
            {language === "vi"
              ? "Tìm kiếm bắt đầu từ 2 ký tự để kết quả chính xác hơn."
              : "Search starts at 2 characters for more precise results."}
          </Text>
        </View>
      );
    }

    if (result.isSearching) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {language === "vi" ? "Đang tìm…" : "Searching…"}
          </Text>
          <Text style={styles.emptyBody}>
            {language === "vi"
              ? "Kết quả sẽ xuất hiện ngay tại đây."
              : "Results will appear here as soon as they are ready."}
          </Text>
        </View>
      );
    }

    if (result.issueQuery.isError) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {language === "vi"
              ? "Không thể tìm công việc"
              : "Could not search issues"}
          </Text>
          <Text style={styles.emptyBody}>
            {language === "vi"
              ? "Dự án vẫn có thể tìm cục bộ. Hãy thử lại sau."
              : "Project matching still works locally. Try again in a moment."}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            accessible={false}
            name="search-outline"
            size={22}
            color={ui.colors.textMuted}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {language === "vi" ? "Không tìm thấy kết quả" : "No results found"}
        </Text>
        <Text style={styles.emptyBody}>
          {language === "vi"
            ? "Thử tên ngắn hơn hoặc nhập trực tiếp mã issue."
            : "Try a shorter name or enter the issue identifier directly."}
        </Text>
      </View>
    );
  };

  return (
    <Screen
      chrome={Platform.OS === "ios" ? "root" : "stack"}
      title={
        Platform.OS === "ios"
          ? undefined
          : language === "vi"
            ? "Tìm kiếm"
            : "Search"
      }
      subtitle={
        Platform.OS === "ios"
          ? undefined
          : hasQuery
            ? `${total} ${language === "vi" ? "kết quả" : "results"}`
            : language === "vi"
              ? "Issue và dự án"
              : "Issues and projects"
      }
      scroll={false}
      floating={iosSearchDock}
    >
      {Platform.OS !== "ios" ? searchInput : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.kind === "project"
            ? `project-${item.project.id}`
            : `issue-${item.issue.id}`
        }
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          Platform.OS === "ios" && styles.listContentIos,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          hasQuery && sections.length > 0 && result.isSearching ? (
            <Text style={styles.searchingMore}>
              {language === "vi"
                ? "Đang cập nhật kết quả công việc…"
                : "Updating issue results…"}
            </Text>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} />
        )}
        renderItem={({ item }) => {
          if (item.kind === "project") {
            const project = item.project;
            return (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={`${project.name}, ${project.key}`}
                onPress={() => openProject(project.id)}
                style={styles.resultRow}
              >
                <View style={styles.projectIcon}>
                  <Text style={styles.projectIconText}>
                    {project.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.meta}>{project.key}</Text>
                </View>
              </MotionPressable>
            );
          }

          const issue = item.issue;
          return (
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`${issue.identifier}, ${issue.title}`}
              onPress={() => openIssue(issue.identifier)}
              onLongPress={() => setQuickIssue(issue)}
              delayLongPress={280}
              style={styles.resultRow}
            >
              <View style={styles.issueIcon}>
                <Ionicons
                  accessible={false}
                  name="checkmark-circle-outline"
                  size={20}
                  color={ui.colors.accentStrong}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>
                  {issue.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {issue.identifier} · {issue.status?.name ?? "—"} ·{" "}
                  {issue.priority}
                </Text>
              </View>
            </MotionPressable>
          );
        }}
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
    keyboardDock: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: "flex-end",
    },
    searchDock: {
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    searchGlass: { flex: 1, minHeight: 54, borderRadius: 28 },
    searchGlassFallback: {
      backgroundColor: ui.colors.surfaceContainerHigh,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.borderStrong,
      ...ui.shadow.floating,
    },
    floatingSearchField: {
      minHeight: 54,
      borderRadius: 28,
      backgroundColor: "transparent",
      paddingLeft: 16,
      paddingRight: 10,
    },
    inlineSearchField: { marginTop: 2 },
    listContent: { flexGrow: 1, paddingBottom: 28 },
    listContentIos: { paddingTop: 28, paddingBottom: 112 },
    resultRow: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ui.colors.border,
    },
    projectIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
    },
    projectIconText: {
      color: ui.colors.accentStrong,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "700",
    },
    issueIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    copy: { flex: 1, minWidth: 0 },
    title: { color: ui.colors.text, ...ui.typography.heading, fontSize: 16 },
    meta: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 3,
    },
    searchingMore: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      paddingTop: 14,
      paddingBottom: 8,
    },
    emptyState: {
      flex: 1,
      minHeight: 280,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 26,
      paddingBottom: 64,
    },
    emptyIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
      marginBottom: 4,
    },
    emptyTitle: { color: ui.colors.text, ...ui.typography.heading },
    emptyBody: {
      maxWidth: 320,
      color: ui.colors.textMuted,
      ...ui.typography.body,
      textAlign: "center",
    },
  });
