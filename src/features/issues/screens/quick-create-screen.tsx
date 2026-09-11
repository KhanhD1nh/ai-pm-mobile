import { showAppSnackbar } from "@/shared/feedback/app-snackbar";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  ChoiceRow,
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { isOfflineMutationReceipt } from "@/infrastructure/persistence/offline-mutation-queue";
import { useAuth } from "@/providers/auth-provider";
import { useProjects } from "@/features/projects/public";
import { useProjectMembers } from "@/features/members/public";
import { useProjectCycles } from "@/features/planning/public";
import type { ParticipantRole, Priority } from "@/shared/contracts";
import { useCreateIssue } from "../mutations/use-board-mutations";

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const participantRoles: ParticipantRole[] = [
  "OBSERVER",
  "REVIEWER",
  "NEXT_REVIEWER",
  "ASSIGNEE",
];

export default function QuickCreateScreen() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const { orgId } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const projects = useProjects(orgId);
  const [projectId, setProjectId] = useState(params.projectId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [cyclePickerOpen, setCyclePickerOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [cycleId, setCycleId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [participantRole, setParticipantRole] =
    useState<ParticipantRole>("OBSERVER");
  const create = useCreateIssue(projectId || undefined);
  const members = useProjectMembers(projectId || undefined).members;
  const cycles = useProjectCycles(projectId || undefined);
  const selectedProject = (projects.data ?? []).find(
    (project) => project.id === projectId,
  );
  const selectedCycle = (cycles.data ?? []).find(
    (cycle) => cycle.id === cycleId,
  );
  const toggleParticipant = (userId: string) =>
    setParticipantIds((current) => {
      if (participantRole === "ASSIGNEE")
        return current.includes(userId) ? [] : [userId];
      return current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId];
    });

  const submit = () =>
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        cycleId: cycleId || undefined,
        assigneeId:
          participantRole === "ASSIGNEE" ? participantIds[0] : undefined,
        // `participantIds` is the legacy shorthand and backend assigns those
        // entries the default OBSERVER role. Sending it together with explicit
        // `participants` would give the same user two semantic roles whenever
        // the selected role is not OBSERVER.
        // ASSIGNEE is special: the issue has a single assignee field and backend
        // mirrors that assignee into the participant list automatically.
        participants:
          participantRole !== "ASSIGNEE" && participantIds.length
            ? participantIds.map((userId) => ({
                userId,
                role: participantRole,
              }))
            : undefined,
      },
      {
        // Create is a dedicated native tab on iOS. After creation, move into the
        // Projects stack so the issue detail lives under a meaningful destination
        // rather than leaving the action tab selected.
        onSuccess: (issue) => {
          if (isOfflineMutationReceipt(issue)) {
            showAppSnackbar(
              language === "vi"
                ? "Đã lưu ngoại tuyến · Công việc sẽ tự tạo khi có mạng trở lại"
                : "Saved offline · The task will be created when you're back online",
              { tone: "warning", durationMs: 4500 },
            );
            router.replace("/(tabs)/(projects)/projects");
            return;
          }
          router.replace({
            pathname: "/(tabs)/(projects)/issue/[identifier]",
            params: { identifier: issue.identifier },
          });
        },
        onError: (error) =>
          presentError(
            language === "vi"
              ? "Không thể tạo công việc"
              : "Could not create task",
            error,
          ),
      },
    );

  return (
    <Screen
      chrome="modal"
      title={language === "vi" ? "Công việc mới" : "New task"}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {language === "vi"
            ? "Bạn muốn hoàn thành việc gì?"
            : "What needs to get done?"}
        </Text>
        <Text style={styles.heroBody}>
          {language === "vi"
            ? "Tạo nhanh một công việc, sau đó bổ sung chi tiết khi cần."
            : "Create the task quickly. Add the finer details later."}
        </Text>
      </View>

      <View style={styles.form}>
        <Field
          autoFocus
          placeholder={language === "vi" ? "Tên công việc" : "Task title"}
          value={title}
          onChangeText={setTitle}
        />
        <Field
          multiline
          placeholder={
            language === "vi"
              ? "Mô tả ngắn (không bắt buộc)"
              : "Short description (optional)"
          }
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <SectionHeader
        title={language === "vi" ? "Dự án" : "Project"}
        caption={
          language === "vi"
            ? "Chọn nơi công việc này thuộc về"
            : "Choose where this task belongs"
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="folder-outline"
          label={
            selectedProject?.name ??
            (language === "vi" ? "Chọn dự án" : "Choose a project")
          }
          detail={
            selectedProject?.key ??
            (language === "vi" ? "Bắt buộc" : "Required")
          }
          onPress={() => setProjectPickerOpen(true)}
        />
      </ListGroup>

      <SectionHeader title={language === "vi" ? "Ưu tiên" : "Priority"} />
      <View style={styles.priorityList}>
        {priorities.map((item) => (
          <ChoiceRow
            key={item}
            label={item}
            active={priority === item}
            onPress={() => setPriority(item)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={
            create.isPending
              ? language === "vi"
                ? "Đang tạo…"
                : "Creating…"
              : language === "vi"
                ? "Tạo công việc"
                : "Create task"
          }
          disabled={!title.trim() || !projectId || create.isPending}
          onPress={submit}
        />
      </View>

      <BottomSheet
        visible={projectPickerOpen}
        title={language === "vi" ? "Chọn dự án" : "Choose project"}
        onClose={() => setProjectPickerOpen(false)}
      >
        {(projects.data ?? []).map((project) => (
          <ChoiceRow
            key={project.id}
            label={project.name}
            description={project.key}
            active={project.id === projectId}
            onPress={() => {
              setProjectId(project.id);
              setCycleId("");
              setParticipantIds([]);
              setProjectPickerOpen(false);
            }}
          />
        ))}
      </BottomSheet>

      <SectionHeader
        title={language === "vi" ? "Chi tiết thêm" : "More details"}
        caption={
          language === "vi"
            ? "Không bắt buộc — bổ sung nếu bạn đã biết"
            : "Optional — add these when you already know them"
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="repeat-outline"
          label={language === "vi" ? "Cycle" : "Cycle"}
          value={
            selectedCycle?.name ||
            (selectedCycle
              ? `#${selectedCycle.number}`
              : language === "vi"
                ? "Không có"
                : "None")
          }
          onPress={projectId ? () => setCyclePickerOpen(true) : undefined}
        />
        <ListRow
          icon="people-outline"
          label={language === "vi" ? "Người tham gia" : "Participants"}
          detail={
            participantIds.length
              ? language === "vi"
                ? `${participantIds.length} người · ${participantRole}`
                : `${participantIds.length} people · ${participantRole}`
              : undefined
          }
          value={
            participantIds.length
              ? String(participantIds.length)
              : language === "vi"
                ? "Không có"
                : "None"
          }
          onPress={projectId ? () => setParticipantsOpen(true) : undefined}
        />
      </ListGroup>

      <BottomSheet
        visible={cyclePickerOpen}
        title="Cycle"
        subtitle={selectedProject?.name}
        onClose={() => setCyclePickerOpen(false)}
      >
        <ChoiceRow
          label={language === "vi" ? "Không có cycle" : "No cycle"}
          active={!cycleId}
          onPress={() => {
            setCycleId("");
            setCyclePickerOpen(false);
          }}
        />
        {(cycles.data ?? []).map((cycle) => (
          <ChoiceRow
            key={cycle.id}
            label={cycle.name || `Cycle ${cycle.number}`}
            description={`#${cycle.number}`}
            active={cycleId === cycle.id}
            onPress={() => {
              setCycleId(cycle.id);
              setCyclePickerOpen(false);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={participantsOpen}
        title={language === "vi" ? "Người tham gia" : "Participants"}
        subtitle={
          participantIds.length
            ? language === "vi"
              ? `Đã chọn ${participantIds.length}`
              : `${participantIds.length} selected`
            : undefined
        }
        onClose={() => setParticipantsOpen(false)}
      >
        <Text style={styles.sheetLabel}>
          {language === "vi"
            ? "Vai trò cho người được chọn"
            : "Role for selected people"}
        </Text>
        {participantRoles.map((role) => (
          <ChoiceRow
            key={role}
            label={role}
            active={participantRole === role}
            onPress={() => {
              setParticipantRole(role);
              if (role === "ASSIGNEE" && participantIds.length > 1)
                setParticipantIds([participantIds[0]!]);
            }}
          />
        ))}
        <Text style={styles.sheetLabel}>
          {language === "vi" ? "Thành viên dự án" : "Project members"}
        </Text>
        {(members.data ?? []).map((member) => (
          <ChoiceRow
            key={member.id}
            label={member.name}
            description={member.email}
            active={participantIds.includes(member.id)}
            onPress={() => toggleParticipant(member.id)}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    hero: { paddingVertical: 10, gap: 7 },
    heroTitle: {
      color: ui.colors.text,
      fontSize: 26,
      lineHeight: 33,
      fontWeight: "700",
      letterSpacing: -0.7,
    },
    heroBody: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      maxWidth: 360,
    },
    form: { gap: 10 },
    priorityList: { gap: 8 },
    footer: { paddingTop: 6, paddingBottom: 12 },
    sheetLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.eyebrow,
      marginTop: 8,
      marginBottom: 2,
    },
  });
