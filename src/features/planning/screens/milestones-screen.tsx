import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  BottomSheet,
  ChoiceRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingScreen,
  Screen,
} from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { presentError } from "@/shared/errors/present-error";
import { isOfflineMutationReceipt } from "@/infrastructure/persistence/offline-mutation-queue";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import type { Milestone } from "@/shared/contracts";
import {
  useCreateMilestone,
  useUpdateMilestone,
  useUpdateMilestoneHealth,
} from "../mutations/use-planning-mutations";
import { useProjectMilestones } from "../queries/use-planning";

function isoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()))
    throw new Error("Ngày phải theo định dạng YYYY-MM-DD");
  return date.toISOString();
}

const TIME_REFERENCE_MS = Date.now();

export default function MilestonesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const milestones = useProjectMilestones(projectId);
  const create = useCreateMilestone(projectId);
  const update = useUpdateMilestone(projectId);
  const updateHealth = useUpdateMilestoneHealth(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Milestone | null>(null);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");

  if (milestones.isLoading && !milestones.data)
    return (
      <LoadingScreen
        chrome="stack"
        title={language === "vi" ? "Cột mốc" : "Milestones"}
      />
    );

  const submit = () => {
    try {
      create.mutate(
        { title: title.trim(), targetDate: isoDate(targetDate) },
        {
          onSuccess: (result) => {
            setCreateOpen(false);
            setTitle("");
            setTargetDate("");
            if (isOfflineMutationReceipt(result)) {
              Alert.alert(
                language === "vi" ? "Đã lưu ngoại tuyến" : "Saved offline",
                language === "vi"
                  ? "Cột mốc sẽ được tạo khi có mạng trở lại."
                  : "The milestone will be created when connectivity returns.",
              );
            }
          },
          onError: (error) =>
            presentError(
              language === "vi"
                ? "Không thể tạo cột mốc"
                : "Could not create milestone",
              error,
            ),
        },
      );
    } catch (error) {
      presentError(
        language === "vi" ? "Ngày không hợp lệ" : "Invalid date",
        error,
      );
    }
  };

  const setStatus = (status: Milestone["status"]) => {
    if (!selected) return;
    update.mutate(
      { milestoneId: selected.id, data: { status } },
      {
        onSuccess: (result) => {
          setSelected(null);
          if (isOfflineMutationReceipt(result))
            Alert.alert(
              language === "vi" ? "Đã lưu ngoại tuyến" : "Saved offline",
            );
        },
        onError: (error) =>
          presentError(
            language === "vi"
              ? "Không thể cập nhật cột mốc"
              : "Could not update milestone",
            error,
          ),
      },
    );
  };

  const setHealth = (
    healthStatus: "HEALTHY" | "WARNING" | "AT_RISK" | "UNKNOWN",
  ) => {
    if (!selected) return;
    updateHealth.mutate(
      {
        milestoneId: selected.id,
        expectedVersion: selected.version,
        healthStatus,
      },
      {
        onSuccess: (result) => {
          setSelected(result);
        },
        onError: (error) =>
          presentError(
            language === "vi"
              ? "Không thể cập nhật sức khỏe cột mốc"
              : "Could not update milestone health",
            error,
          ),
      },
    );
  };

  const healthColor = (health: string) =>
    health === "AT_RISK"
      ? ui.colors.danger
      : health === "WARNING"
        ? ui.colors.warning
        : health === "HEALTHY"
          ? ui.colors.success
          : ui.colors.textMuted;
  const riskItems = (milestones.data ?? []).filter((milestone) => {
    if (milestone.status !== "OPEN") return false;
    if (
      milestone.health_status === "AT_RISK" ||
      milestone.health_status === "WARNING"
    )
      return true;
    return new Date(milestone.target_date).getTime() < TIME_REFERENCE_MS;
  });

  const dueLabel = (milestone: Milestone) => {
    const target = new Date(milestone.target_date);
    const diffDays = Math.ceil(
      (target.getTime() - TIME_REFERENCE_MS) / 86_400_000,
    );
    if (milestone.status === "COMPLETED")
      return language === "vi" ? "Đã hoàn thành" : "Completed";
    if (diffDays < 0)
      return language === "vi"
        ? `Trễ ${Math.abs(diffDays)} ngày`
        : `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0)
      return language === "vi" ? "Đến hạn hôm nay" : "Due today";
    return language === "vi" ? `Còn ${diffDays} ngày` : `${diffDays}d left`;
  };

  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Cột mốc" : "Milestones"}
      subtitle={
        language === "vi"
          ? "Theo dõi mục tiêu và rủi ro dự án"
          : "Track project goals and health"
      }
    >
      <View style={styles.headerRow}>
        <SectionHeader
          title={language === "vi" ? "Mục tiêu dự án" : "Project goals"}
          caption={`${milestones.data?.length ?? 0}`}
        />
        <Button
          title={language === "vi" ? "Tạo" : "New"}
          onPress={() => setCreateOpen(true)}
        />
      </View>
      {milestones.isError ? (
        <ErrorState
          title={
            language === "vi"
              ? "Không tải được cột mốc"
              : "Could not load milestones"
          }
          onRetry={() => void milestones.refetch()}
        />
      ) : null}
      {!milestones.isError && (milestones.data ?? []).length === 0 ? (
        <EmptyState
          title={language === "vi" ? "Chưa có cột mốc" : "No milestones yet"}
          body={
            language === "vi"
              ? "Thêm mục tiêu quan trọng để theo dõi tiến độ và rủi ro."
              : "Add an important goal to track progress and risk."
          }
        />
      ) : null}
      {riskItems.length > 0 ? (
        <>
          <SectionHeader
            title={language === "vi" ? "Cần chú ý" : "Needs attention"}
            caption={`${riskItems.length}`}
          />
          <View style={styles.riskList}>
            {riskItems.slice(0, 5).map((milestone) => (
              <View key={milestone.id} style={styles.riskRow}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={
                    milestone.health_status === "AT_RISK"
                      ? ui.colors.danger
                      : ui.colors.warning
                  }
                />
                <View style={styles.riskCopy}>
                  <Text style={styles.riskTitle} numberOfLines={1}>
                    {milestone.title}
                  </Text>
                  <Text style={styles.riskMeta}>
                    {milestone.health_status} · {dueLabel(milestone)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.list}>
        {(milestones.data ?? []).map((milestone, index) => (
          <MotionPressable
            key={milestone.id}
            accessibilityRole="button"
            onPress={() => setSelected(milestone)}
            style={[styles.row, index > 0 && styles.divider]}
          >
            <View
              style={[
                styles.healthBar,
                { backgroundColor: healthColor(milestone.health_status) },
              ]}
            />
            <View style={styles.copy}>
              <View style={styles.titleLine}>
                <Text style={styles.title}>{milestone.title}</Text>
                <Text
                  style={[
                    styles.health,
                    { color: healthColor(milestone.health_status) },
                  ]}
                >
                  {milestone.health_status}
                </Text>
              </View>
              <Text style={styles.meta}>
                {new Date(milestone.target_date).toLocaleDateString()} ·{" "}
                {dueLabel(milestone)} · {milestone.status}
              </Text>
              {milestone.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {milestone.description}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={ui.colors.textMuted}
            />
          </MotionPressable>
        ))}
      </View>

      <BottomSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        title={language === "vi" ? "Tạo cột mốc" : "Create milestone"}
        footer={
          <Button
            title={
              create.isPending
                ? "…"
                : language === "vi"
                  ? "Tạo cột mốc"
                  : "Create milestone"
            }
            disabled={!title.trim() || !targetDate || create.isPending}
            onPress={submit}
          />
        }
      >
        <View style={styles.form}>
          <Field
            placeholder={language === "vi" ? "Tên cột mốc" : "Milestone title"}
            value={title}
            onChangeText={setTitle}
          />
          <Field
            placeholder="YYYY-MM-DD"
            value={targetDate}
            onChangeText={setTargetDate}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        subtitle={
          language === "vi"
            ? `Sức khỏe: ${selected?.health_status ?? "—"}`
            : `Health: ${selected?.health_status ?? "—"}`
        }
      >
        <SectionHeader title={language === "vi" ? "Trạng thái" : "Status"} />
        {(["OPEN", "COMPLETED", "CANCELED"] as const).map((status) => (
          <ChoiceRow
            key={status}
            label={status}
            active={selected?.status === status}
            onPress={() => setStatus(status)}
          />
        ))}
        <SectionHeader
          title={language === "vi" ? "Sức khỏe" : "Health"}
          caption={
            language === "vi"
              ? "Thay đổi này có thể phát cảnh báo cho thành viên dự án"
              : "Changes can notify project members"
          }
        />
        {(["HEALTHY", "WARNING", "AT_RISK", "UNKNOWN"] as const).map(
          (health) => (
            <ChoiceRow
              key={health}
              label={health}
              active={selected?.health_status === health}
              onPress={() => setHealth(health)}
            />
          ),
        )}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
    },
    list: { overflow: "hidden" },
    row: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    healthBar: { width: 3, height: 46, borderRadius: 2 },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    titleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { flex: 1, color: ui.colors.text, ...ui.typography.bodyStrong },
    health: { ...ui.typography.eyebrow },
    meta: { color: ui.colors.textSecondary, ...ui.typography.caption },
    description: { color: ui.colors.textMuted, ...ui.typography.caption },
    form: { gap: 10 },
    riskList: {
      overflow: "hidden",
      borderRadius: ui.radius.lg,
      backgroundColor: ui.colors.warningSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.warning,
    },
    riskRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    riskCopy: { flex: 1, minWidth: 0 },
    riskTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
    riskMeta: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      marginTop: 2,
    },
  });
