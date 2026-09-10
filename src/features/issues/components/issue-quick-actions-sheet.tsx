import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { membersApi, memberKeys } from "@/features/members/public";
import { workflowsApi, workflowKeys } from "@/features/workflows/public";
import {
  BottomSheet,
  ChoiceRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import type { Issue, Priority, WorkflowStatus } from "@/shared/contracts";
import { presentError } from "@/shared/errors/present-error";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import {
  useQuickScheduleIssue,
  useQuickUpdateIssue,
} from "../mutations/use-quick-issue-mutations";

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function nextHalfHour() {
  const value = new Date();
  value.setSeconds(0, 0);
  value.setMinutes(value.getMinutes() < 30 ? 30 : 0);
  if (value.getMinutes() === 0) value.setHours(value.getHours() + 1);
  return value;
}

function tomorrowMorning() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(9, 0, 0, 0);
  return value;
}

export function IssueQuickActionsSheet({
  issue,
  onClose,
}: {
  issue: Issue | null;
  onClose: () => void;
}) {
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const projectId = issue?.project_id;
  const statuses = useQuery({
    queryKey: workflowKeys.statuses(projectId),
    queryFn: () => workflowsApi.statuses(projectId!),
    enabled: Boolean(projectId && issue),
  });
  const members = useQuery({
    queryKey: memberKeys.project(projectId),
    queryFn: () => membersApi.list(projectId!),
    enabled: Boolean(projectId && issue),
  });
  const update = useQuickUpdateIssue(projectId);
  const schedule = useQuickScheduleIssue(projectId);
  const busy = update.isPending || schedule.isPending;
  const orderedStatuses = useMemo(
    () => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position),
    [statuses.data],
  );

  const fail = (error: unknown) =>
    presentError(
      language === "vi"
        ? "Không thể cập nhật công việc"
        : "Could not update task",
      error,
    );

  const patch = (data: {
    statusId?: string;
    priority?: Priority;
    assigneeId?: string | null;
  }) => {
    if (!issue || busy) return;
    update.mutate(
      { issue, patch: data },
      { onSuccess: onClose, onError: fail },
    );
  };

  const setSchedule = (startsAt: Date) => {
    if (!issue || busy) return;
    schedule.mutate(
      { issue, startsAt: startsAt.toISOString(), durationHours: 1 },
      { onSuccess: onClose, onError: fail },
    );
  };

  const openDetail = () => {
    if (!issue) return;
    onClose();
    router.push({
      pathname: "/issue/[identifier]",
      params: { identifier: issue.identifier },
    });
  };

  return (
    <BottomSheet
      visible={Boolean(issue)}
      title={issue ? `${issue.identifier} · ${issue.title}` : ""}
      subtitle={language === "vi" ? "Thao tác nhanh" : "Quick actions"}
      onClose={onClose}
    >
      <SectionHeader title={language === "vi" ? "Trạng thái" : "Status"} />
      {orderedStatuses.map((status: WorkflowStatus) => (
        <ChoiceRow
          key={status.id}
          label={status.name}
          active={issue?.status_id === status.id}
          disabled={busy}
          onPress={() => patch({ statusId: status.id })}
        />
      ))}

      <SectionHeader title={language === "vi" ? "Ưu tiên" : "Priority"} />
      <View style={styles.inlineChoices}>
        {priorities.map((priority) => (
          <MotionPressable
            key={priority}
            accessibilityRole="button"
            accessibilityState={{ selected: issue?.priority === priority }}
            disabled={busy}
            onPress={() => patch({ priority })}
            style={[
              styles.choiceChip,
              issue?.priority === priority && styles.choiceChipActive,
            ]}
          >
            <Text
              style={[
                styles.choiceText,
                issue?.priority === priority && styles.choiceTextActive,
              ]}
            >
              {priority}
            </Text>
          </MotionPressable>
        ))}
      </View>

      <SectionHeader
        title={language === "vi" ? "Người phụ trách" : "Assignee"}
      />
      <ChoiceRow
        label={language === "vi" ? "Chưa giao" : "Unassigned"}
        active={!issue?.assignee_id}
        disabled={busy}
        onPress={() => patch({ assigneeId: null })}
      />
      {(members.data ?? []).slice(0, 12).map((member) => (
        <ChoiceRow
          key={member.id}
          label={member.name}
          description={member.email}
          active={issue?.assignee_id === member.id}
          disabled={busy}
          onPress={() => patch({ assigneeId: member.id })}
        />
      ))}

      <SectionHeader title={language === "vi" ? "Lên lịch" : "Schedule"} />
      <ChoiceRow
        label={language === "vi" ? "Khung 1 giờ tiếp theo" : "Next 1-hour slot"}
        description={nextHalfHour().toLocaleString(
          language === "vi" ? "vi-VN" : "en-US",
        )}
        disabled={busy}
        onPress={() => setSchedule(nextHalfHour())}
      />
      <ChoiceRow
        label={language === "vi" ? "Ngày mai 09:00" : "Tomorrow 09:00"}
        disabled={busy}
        onPress={() => setSchedule(tomorrowMorning())}
      />

      <MotionPressable
        accessibilityRole="button"
        onPress={openDetail}
        style={styles.openDetail}
      >
        <Text style={styles.openDetailText}>
          {language === "vi" ? "Mở chi tiết công việc" : "Open task details"}
        </Text>
      </MotionPressable>
    </BottomSheet>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    inlineChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    choiceChip: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: ui.colors.surfaceRaised,
    },
    choiceChipActive: { backgroundColor: ui.colors.accentSoft },
    choiceText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "700",
    },
    choiceTextActive: { color: ui.colors.accentStrong },
    openDetail: { minHeight: 50, justifyContent: "center", marginTop: 8 },
    openDetailText: {
      color: ui.colors.accentStrong,
      ...ui.typography.bodyStrong,
    },
  });
