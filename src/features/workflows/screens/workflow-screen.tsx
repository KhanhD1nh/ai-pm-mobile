import { showAppAlert } from "@/shared/feedback/app-alert";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Field, Pill } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  ChoiceRow,
  GlassIconButton,
  ListGroup,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import type { StatusCategory } from "@/shared/contracts";
import { useWorkflow } from "../queries/use-workflow";
import {
  useCreateWorkflowStatus,
  useDeleteWorkflowStatus,
  useUpdateWorkflowStatus,
} from "../mutations/use-workflow-mutations";

const categories: StatusCategory[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELED",
  "REJECTED",
];

export default function WorkflowScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project, ordered } = useWorkflow(projectId);
  const create = useCreateWorkflowStatus(projectId);
  const update = useUpdateWorkflowStatus(projectId);
  const remove = useDeleteWorkflowStatus(projectId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StatusCategory>("TODO");

  const onError = (error: unknown) =>
    presentError(
      language === "vi"
        ? "Không thể cập nhật workflow"
        : "Could not update workflow",
      error,
    );
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const current = ordered[index]!;
    const next = ordered[target]!;
    update.mutate(
      { id: current.id, data: { position: next.position } },
      { onError },
    );
    update.mutate(
      { id: next.id, data: { position: current.position } },
      { onError },
    );
  };
  const createStatus = () =>
    create.mutate(
      { name: name.trim(), category, position: ordered.length + 1 },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
        },
        onError,
      },
    );

  return (
    <Screen
      chrome="stack"
      title="Workflow"
      subtitle={project.data?.name ?? project.data?.key}
      right={
        <GlassIconButton
          icon="add"
          label={language === "vi" ? "Thêm status" : "Add status"}
          onPress={() => setOpen(true)}
        />
      }
    >
      <SectionHeader
        title={language === "vi" ? "Luồng trạng thái" : "Status flow"}
        caption={
          language === "vi"
            ? "Thứ tự này quyết định cách issue di chuyển trên board"
            : "This order controls how issues move across the board"
        }
      />
      <ListGroup variant="plain">
        {ordered.map((status, index) => (
          <View
            key={status.id}
            style={[styles.statusRow, index > 0 && styles.border]}
          >
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{status.name}</Text>
                {status.is_default ? (
                  <Pill text="DEFAULT" tone="accent" />
                ) : null}
              </View>
              <Text style={styles.meta}>{status.category}</Text>
            </View>
            <View style={styles.actions}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={
                  language === "vi" ? "Di chuyển lên" : "Move up"
                }
                disabled={index === 0}
                onPress={() => move(index, -1)}
                style={[styles.iconButton, index === 0 && styles.disabled]}
              >
                <Ionicons
                  accessible={false}
                  name="arrow-up"
                  size={17}
                  color={ui.colors.textSecondary}
                />
              </MotionPressable>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={
                  language === "vi" ? "Di chuyển xuống" : "Move down"
                }
                disabled={index === ordered.length - 1}
                onPress={() => move(index, 1)}
                style={[
                  styles.iconButton,
                  index === ordered.length - 1 && styles.disabled,
                ]}
              >
                <Ionicons
                  accessible={false}
                  name="arrow-down"
                  size={17}
                  color={ui.colors.textSecondary}
                />
              </MotionPressable>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={
                  language === "vi" ? "Xóa trạng thái" : "Delete status"
                }
                onPress={() =>
                  showAppAlert(
                    language === "vi" ? "Xóa status?" : "Delete status?",
                    status.name,
                    [
                      { text: language === "vi" ? "Hủy" : "Cancel" },
                      {
                        text: language === "vi" ? "Xóa" : "Delete",
                        style: "destructive",
                        onPress: () => remove.mutate(status.id, { onError }),
                      },
                    ],
                  )
                }
                style={[styles.iconButton, styles.dangerButton]}
              >
                <Ionicons
                  accessible={false}
                  name="trash-outline"
                  size={17}
                  color={ui.colors.danger}
                />
              </MotionPressable>
            </View>
          </View>
        ))}
      </ListGroup>

      <BottomSheet
        visible={open}
        title={language === "vi" ? "Tạo status" : "Create status"}
        onClose={() => setOpen(false)}
        footer={
          <Button
            title={language === "vi" ? "Tạo status" : "Create status"}
            disabled={!name.trim() || create.isPending}
            onPress={createStatus}
          />
        }
      >
        <Field
          placeholder={language === "vi" ? "Tên status" : "Status name"}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Text style={styles.sheetLabel}>
          {language === "vi" ? "Nhóm trạng thái" : "Status category"}
        </Text>
        {categories.map((item) => (
          <ChoiceRow
            key={item}
            label={item}
            active={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    statusRow: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 11,
    },
    border: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    indexBadge: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    indexText: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontWeight: "700",
    },
    copy: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    title: {
      flexShrink: 1,
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
    },
    meta: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 3,
    },
    actions: { flexDirection: "row", gap: 5 },
    iconButton: {
      width: Platform.OS === "android" ? 48 : 44,
      height: Platform.OS === "android" ? 48 : 44,
      borderRadius: Platform.OS === "android" ? 16 : 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    dangerButton: { backgroundColor: ui.colors.dangerSoft },
    disabled: { opacity: 0.32 },
    sheetLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.eyebrow,
      marginTop: 8,
      marginBottom: 2,
    },
  });
