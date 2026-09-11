import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { WorkspaceSwitcher } from "@/features/organizations/public";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  GlassIconButton,
  ListGroup,
  ListRow,
} from "@/shared/components/ui/mobile";
import type { Project } from "@/shared/contracts";
import { EmptyState, Screen } from "@/shared/components/ui/screen";
import { MotionPressable } from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import { useProjects } from "../queries/use-projects";
import { useCreateProject } from "../mutations/use-project-mutations";

export default function ProjectsScreen() {
  const { orgId, organizations } = useAuth();
  const { theme: ui, t, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const projects = useProjects(orgId);
  const pullRefresh = usePullToRefresh(() => projects.refetch());
  const create = useCreateProject();
  const [open, setOpen] = useState(false);
  const [quickProject, setQuickProject] = useState<Project | null>(null);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const currentOrg = organizations.find((item) => item.id === orgId);

  const submit = () =>
    create.mutate(
      {
        key: key.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: (project) => {
          setOpen(false);
          setKey("");
          setName("");
          setDescription("");
          router.push({
            pathname: "/project/[projectId]",
            params: { projectId: project.id },
          });
        },
        onError: (error) => presentError(t("projects.createError"), error),
      },
    );

  return (
    <Screen scroll={false}>
      <FlatList
        data={projects.data ?? []}
        keyExtractor={(project) => project.id}
        showsVerticalScrollIndicator={false}
        refreshing={pullRefresh.refreshing}
        onRefresh={pullRefresh.onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.appBar}>
            <View style={styles.topBar}>
              <WorkspaceSwitcher />
              <View style={styles.headerActions}>
                <GlassIconButton
                  icon="search-outline"
                  label={language === "vi" ? "Tìm kiếm" : "Search"}
                  onPress={() => router.push("/search")}
                />
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={t("projects.createTitle")}
                  android_ripple={
                    Platform.OS === "android"
                      ? {
                          color: ui.colors.accentSoft,
                          borderless: true,
                          radius: ui.header.actionSize / 2,
                        }
                      : undefined
                  }
                  onPress={() => setOpen(true)}
                  style={styles.createButton}
                >
                  <Ionicons
                    accessible={false}
                    name="add"
                    size={ui.header.iconSize}
                    color={ui.colors.inverseText}
                  />
                </MotionPressable>
              </View>
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>{t("projects.title")}</Text>
              <Text style={styles.subtitle}>
                {projects.data?.length ?? 0} {t("projects.projectCount")}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t("projects.emptyTitle")}
            body={t("projects.emptyBody")}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.projectRowBorder} />}
        renderItem={({ item: project }) => (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${project.name}, ${project.issue_counter} ${t("projects.issues")}`}
            onPress={() =>
              router.push({
                pathname: "/project/[projectId]",
                params: { projectId: project.id },
              })
            }
            onLongPress={() => setQuickProject(project)}
            delayLongPress={280}
            style={styles.projectRow}
          >
            <View style={styles.projectDot} />
            <View style={styles.projectCopy}>
              <View style={styles.projectTopLine}>
                <Text style={styles.projectTitle} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={styles.projectKey}>{project.key}</Text>
              </View>
              {project.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {project.description}
                </Text>
              ) : null}
              <Text style={styles.metaText}>
                {project.issue_counter} {t("projects.issues")}
              </Text>
            </View>
            <Ionicons
              accessible={false}
              name="chevron-forward"
              size={17}
              color={ui.colors.textMuted}
            />
          </MotionPressable>
        )}
      />

      <BottomSheet
        visible={Boolean(quickProject)}
        title={quickProject?.name ?? ""}
        subtitle={quickProject?.key}
        onClose={() => setQuickProject(null)}
      >
        <ListGroup>
          <ListRow
            first
            icon="add-circle-outline"
            label={language === "vi" ? "Tạo công việc" : "Create task"}
            onPress={() => {
              if (!quickProject) return;
              const projectId = quickProject.id;
              setQuickProject(null);
              router.push({ pathname: "/quick-create", params: { projectId } });
            }}
          />
          <ListRow
            icon="checkbox-outline"
            label={language === "vi" ? "Công việc" : "Tasks"}
            onPress={() => {
              if (!quickProject) return;
              const projectId = quickProject.id;
              setQuickProject(null);
              router.push(`/project/${projectId}/board` as never);
            }}
          />
          <ListRow
            icon="calendar-outline"
            label={language === "vi" ? "Lịch" : "Planning"}
            onPress={() => {
              if (!quickProject) return;
              const projectId = quickProject.id;
              setQuickProject(null);
              router.push(`/project/${projectId}/planning` as never);
            }}
          />
          <ListRow
            icon="people-outline"
            label={language === "vi" ? "Thành viên" : "Members"}
            onPress={() => {
              if (!quickProject) return;
              const projectId = quickProject.id;
              setQuickProject(null);
              router.push(`/project/${projectId}/members` as never);
            }}
          />
        </ListGroup>
      </BottomSheet>

      <BottomSheet
        visible={open}
        title={t("projects.createTitle")}
        subtitle={currentOrg?.name}
        onClose={() => setOpen(false)}
        footer={
          <Button
            title={
              create.isPending
                ? t("projects.creating")
                : t("projects.createTitle")
            }
            disabled={!key.trim() || !name.trim() || create.isPending}
            onPress={submit}
          />
        }
      >
        <Field
          placeholder={t("projects.keyPlaceholder")}
          autoCapitalize="characters"
          value={key}
          onChangeText={setKey}
        />
        <Field
          placeholder={t("projects.namePlaceholder")}
          value={name}
          onChangeText={setName}
        />
        <Field
          placeholder={t("projects.descriptionPlaceholder")}
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    listContent: { paddingBottom: 24 },
    appBar: {
      paddingTop: 4,
      paddingBottom: 10,
      gap: 12,
    },
    topBar: {
      minHeight: ui.header.actionSize,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    headingCopy: { flex: 1, minWidth: 0 },
    title: {
      color: ui.colors.text,
      ...ui.typography.screenTitle,
    },
    subtitle: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    createButton: {
      width: ui.header.actionSize,
      height: ui.header.actionSize,
      borderRadius: ui.radius.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentStrong,
      overflow: "hidden",
    },
    projectRow: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    projectRowBorder: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ui.colors.border,
    },
    projectDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: ui.colors.accentStrong,
    },
    projectCopy: { flex: 1, minWidth: 0 },
    projectTopLine: { flexDirection: "row", alignItems: "baseline", gap: 8 },
    projectTitle: {
      flex: 1,
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      fontSize: 16,
    },
    projectKey: {
      color: ui.colors.textMuted,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: "600",
    },
    description: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      marginTop: 3,
    },
    metaText: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 11.5,
      marginTop: 4,
    },
  });
