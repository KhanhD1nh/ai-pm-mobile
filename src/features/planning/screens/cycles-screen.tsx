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
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { isOfflineMutationReceipt } from "@/infrastructure/persistence/offline-mutation-queue";
import type { Cycle } from "@/shared/contracts";
import {
  useAddIssueToCycle,
  useCreateCycle,
  useRemoveIssueFromCycle,
  useUpdateCycle,
} from "../mutations/use-planning-mutations";
import {
  useBacklogIssues,
  useCycleIssues,
  useProjectCycles,
} from "../queries/use-planning";

function isoDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()))
    throw new Error("Ngày phải theo định dạng YYYY-MM-DD");
  return date.toISOString();
}

export default function CyclesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const cycles = useProjectCycles(projectId);
  const create = useCreateCycle(projectId);
  const update = useUpdateCycle(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Cycle | null>(null);
  const cycleIssues = useCycleIssues(projectId, selected?.id);
  const backlogIssues = useBacklogIssues(projectId, Boolean(selected));
  const addIssue = useAddIssueToCycle(projectId, selected?.id);
  const removeIssue = useRemoveIssueFromCycle(projectId, selected?.id);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  if (cycles.isLoading && !cycles.data)
    return (
      <LoadingScreen
        chrome="stack"
        title={language === "vi" ? "Chu kỳ" : "Cycles"}
      />
    );

  const submit = () => {
    try {
      create.mutate(
        { name: name.trim(), startsAt: isoDate(start), endsAt: isoDate(end) },
        {
          onSuccess: (result) => {
            setCreateOpen(false);
            setName("");
            setStart("");
            setEnd("");
            if (isOfflineMutationReceipt(result)) {
              Alert.alert(
                language === "vi" ? "Đã lưu ngoại tuyến" : "Saved offline",
                language === "vi"
                  ? "Chu kỳ sẽ được tạo khi có mạng trở lại."
                  : "The cycle will be created when connectivity returns.",
              );
            }
          },
          onError: (error) =>
            presentError(
              language === "vi"
                ? "Không thể tạo chu kỳ"
                : "Could not create cycle",
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

  const setStatus = (status: Cycle["status"]) => {
    if (!selected) return;
    update.mutate(
      { cycleId: selected.id, data: { status } },
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
              ? "Không thể cập nhật chu kỳ"
              : "Could not update cycle",
            error,
          ),
      },
    );
  };

  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Chu kỳ / Sprint" : "Cycles / Sprints"}
      subtitle={
        language === "vi"
          ? "Lập kế hoạch theo nhịp làm việc"
          : "Plan work in focused iterations"
      }
    >
      <View style={styles.headerRow}>
        <SectionHeader
          title={language === "vi" ? "Tất cả chu kỳ" : "All cycles"}
          caption={`${cycles.data?.length ?? 0}`}
        />
        <Button
          title={language === "vi" ? "Tạo" : "New"}
          onPress={() => setCreateOpen(true)}
        />
      </View>
      {cycles.isError ? (
        <ErrorState
          title={
            language === "vi"
              ? "Không tải được chu kỳ"
              : "Could not load cycles"
          }
          onRetry={() => void cycles.refetch()}
        />
      ) : null}
      {!cycles.isError && (cycles.data ?? []).length === 0 ? (
        <EmptyState
          title={language === "vi" ? "Chưa có chu kỳ" : "No cycles yet"}
          body={
            language === "vi"
              ? "Tạo sprint đầu tiên để gom công việc theo giai đoạn."
              : "Create the first sprint to group work into an iteration."
          }
        />
      ) : null}
      <View style={styles.list}>
        {(cycles.data ?? []).map((cycle, index) => (
          <MotionPressable
            key={cycle.id}
            accessibilityRole="button"
            onPress={() => setSelected(cycle)}
            style={[styles.row, index > 0 && styles.divider]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    cycle.status === "ACTIVE"
                      ? ui.colors.success
                      : cycle.status === "COMPLETED"
                        ? ui.colors.textMuted
                        : ui.colors.accent,
                },
              ]}
            />
            <View style={styles.copy}>
              <View style={styles.titleLine}>
                <Text style={styles.title}>{cycle.name}</Text>
                <Text style={styles.badge}>{cycle.status}</Text>
              </View>
              <Text style={styles.meta}>
                {new Date(cycle.start_date).toLocaleDateString()} –{" "}
                {new Date(cycle.end_date).toLocaleDateString()}
              </Text>
              <View style={styles.progressLine}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${cycle.issue_count ? Math.round(((cycle.done_count ?? 0) / cycle.issue_count) * 100) : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {cycle.done_count ?? 0}/{cycle.issue_count ?? 0}
                </Text>
              </View>
              {cycle.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {cycle.description}
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
        title={language === "vi" ? "Tạo chu kỳ" : "Create cycle"}
        footer={
          <Button
            title={
              create.isPending
                ? "…"
                : language === "vi"
                  ? "Tạo chu kỳ"
                  : "Create cycle"
            }
            disabled={!name.trim() || !start || !end || create.isPending}
            onPress={submit}
          />
        }
      >
        <View style={styles.form}>
          <Field
            placeholder={language === "vi" ? "Tên chu kỳ" : "Cycle name"}
            value={name}
            onChangeText={setName}
          />
          <Field
            placeholder="YYYY-MM-DD"
            value={start}
            onChangeText={setStart}
          />
          <Field placeholder="YYYY-MM-DD" value={end} onChangeText={setEnd} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={
          language === "vi"
            ? `${selected?.done_count ?? 0}/${selected?.issue_count ?? 0} công việc hoàn thành`
            : `${selected?.done_count ?? 0}/${selected?.issue_count ?? 0} tasks done`
        }
      >
        <SectionHeader title={language === "vi" ? "Trạng thái" : "Status"} />
        {(["UPCOMING", "ACTIVE", "COMPLETED"] as const).map((status) => (
          <ChoiceRow
            key={status}
            label={status}
            active={selected?.status === status}
            onPress={() => setStatus(status)}
          />
        ))}

        <SectionHeader
          title={language === "vi" ? "Trong sprint" : "In sprint"}
          caption={`${cycleIssues.data?.length ?? 0}`}
        />
        {(cycleIssues.data ?? []).map((issue) => (
          <View key={issue.id} style={styles.issueRow}>
            <View style={styles.issueCopy}>
              <Text style={styles.issueTitle} numberOfLines={1}>
                {issue.identifier} · {issue.title}
              </Text>
              <Text style={styles.issueMeta}>
                {issue.priority} · {issue.status?.name ?? "—"}
              </Text>
            </View>
            <Button
              title={language === "vi" ? "Bỏ" : "Remove"}
              disabled={removeIssue.isPending}
              onPress={() =>
                removeIssue.mutate(issue.id, {
                  onError: (error) =>
                    presentError(
                      language === "vi"
                        ? "Không thể bỏ khỏi sprint"
                        : "Could not remove from sprint",
                      error,
                    ),
                })
              }
            />
          </View>
        ))}
        {cycleIssues.isLoading ? (
          <Text style={styles.emptyCopy}>
            {language === "vi" ? "Đang tải công việc…" : "Loading tasks…"}
          </Text>
        ) : null}
        {!cycleIssues.isLoading && (cycleIssues.data ?? []).length === 0 ? (
          <Text style={styles.emptyCopy}>
            {language === "vi"
              ? "Sprint chưa có công việc."
              : "No tasks in this sprint."}
          </Text>
        ) : null}

        <SectionHeader
          title={language === "vi" ? "Thêm từ backlog" : "Add from backlog"}
          caption={`${backlogIssues.data?.length ?? 0}`}
        />
        {(backlogIssues.data ?? []).slice(0, 30).map((issue) => (
          <View key={issue.id} style={styles.issueRow}>
            <View style={styles.issueCopy}>
              <Text style={styles.issueTitle} numberOfLines={1}>
                {issue.identifier} · {issue.title}
              </Text>
              <Text style={styles.issueMeta}>{issue.priority}</Text>
            </View>
            <Button
              title={language === "vi" ? "Thêm" : "Add"}
              disabled={addIssue.isPending}
              onPress={() =>
                addIssue.mutate(issue.id, {
                  onError: (error) =>
                    presentError(
                      language === "vi"
                        ? "Không thể thêm vào sprint"
                        : "Could not add to sprint",
                      error,
                    ),
                })
              }
            />
          </View>
        ))}
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
      minHeight: 78,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    copy: { flex: 1, minWidth: 0, gap: 3 },
    titleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { flex: 1, color: ui.colors.text, ...ui.typography.bodyStrong },
    badge: { color: ui.colors.textMuted, ...ui.typography.eyebrow },
    meta: { color: ui.colors.textSecondary, ...ui.typography.caption },
    progressLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
    },
    progressTrack: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: ui.colors.surfaceRaised,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: ui.colors.success,
    },
    progressText: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      minWidth: 34,
      textAlign: "right",
    },
    description: { color: ui.colors.textMuted, ...ui.typography.caption },
    form: { gap: 10 },
    issueRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ui.colors.border,
    },
    issueCopy: { flex: 1, minWidth: 0 },
    issueTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
    issueMeta: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    emptyCopy: {
      color: ui.colors.textMuted,
      ...ui.typography.body,
      paddingVertical: 10,
    },
  });
