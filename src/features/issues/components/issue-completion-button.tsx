import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { workflowsApi, workflowKeys } from "@/features/workflows/public";
import { MotionPressable } from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import type { Issue, WorkflowStatus } from "@/shared/contracts";
import { presentError } from "@/shared/errors/present-error";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { useQuickUpdateIssue } from "../mutations/use-quick-issue-mutations";

export function IssueCompletionButton({ issue }: { issue: Issue }) {
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const statuses = useQuery({
    queryKey: workflowKeys.statuses(issue.project_id),
    queryFn: () => workflowsApi.statuses(issue.project_id),
  });
  const update = useQuickUpdateIssue(issue.project_id);
  const ordered = useMemo(
    () => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position),
    [statuses.data],
  );
  const current =
    ordered.find((status) => status.id === issue.status_id) ?? issue.status;
  const isDone = current?.category === "DONE";
  const doneStatus = ordered.find((status) => status.category === "DONE");
  const fallback = ordered.find((status: WorkflowStatus) =>
    ["TODO", "IN_PROGRESS", "IN_REVIEW", "BACKLOG"].includes(status.category),
  );
  const target = isDone ? fallback : doneStatus;
  const disabled =
    !target ||
    update.isPending ||
    ["CANCELED", "REJECTED"].includes(current?.category ?? "");

  return (
    <MotionPressable
      accessibilityRole="checkbox"
      accessibilityLabel={
        language === "vi"
          ? isDone
            ? `Mở lại ${issue.identifier}`
            : `Hoàn thành ${issue.identifier}`
          : isDone
            ? `Reopen ${issue.identifier}`
            : `Complete ${issue.identifier}`
      }
      accessibilityState={{ checked: isDone, disabled }}
      disabled={disabled}
      onPress={() => {
        if (!target) return;
        update.mutate(
          { issue, patch: { statusId: target.id } },
          {
            onError: (error) =>
              presentError(
                language === "vi"
                  ? "Không thể cập nhật trạng thái"
                  : "Could not update status",
                error,
              ),
          },
        );
      }}
      style={styles.hit}
    >
      {update.isPending ? (
        <ActivityIndicator size="small" color={ui.colors.accentStrong} />
      ) : (
        <View style={[styles.circle, isDone && styles.circleDone]}>
          {isDone ? (
            <Ionicons
              name="checkmark"
              size={14}
              color={ui.colors.inverseText}
            />
          ) : null}
        </View>
      )}
    </MotionPressable>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    hit: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    circle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: ui.colors.borderStrong,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surface,
    },
    circleDone: {
      borderColor: ui.colors.success,
      backgroundColor: ui.colors.success,
    },
  });
