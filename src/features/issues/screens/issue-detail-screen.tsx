import { showAppAlert } from "@/shared/feedback/app-alert";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DateTimePicker as NativeDateTimePicker } from "@expo/ui/community/datetime-picker";
import Markdown from "@ronradtke/react-native-markdown-display";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  ChoiceRow,
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { LoadingScreen, Screen } from "@/shared/components/ui/screen";
import {
  priorityColor,
  statusCategoryColor,
  type AppTheme,
} from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import type { ParticipantRole, Priority } from "@/shared/contracts";
import { useIssueDetailData } from "../queries/use-issue-detail-data";
import {
  useAddIssueComment,
  useAddIssueParticipant,
  useArchiveIssue,
  useCreateIssueRelation,
  useDeleteIssueComment,
  useDeleteIssueRelation,
  useMoveIssueCycle,
  useRemoveIssueParticipant,
  useScheduleIssue,
  useUpdateIssue,
} from "../mutations/use-issue-detail-mutations";

const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const participantRoles: ParticipantRole[] = [
  "ASSIGNEE",
  "REVIEWER",
  "NEXT_REVIEWER",
  "OBSERVER",
];
const relationTypes = ["BLOCKS", "RELATES_TO", "DUPLICATES"] as const;
const scheduleDurationOptions = [0.5, 1, 2, 4] as const;
type Sheet =
  | "status"
  | "priority"
  | "assignee"
  | "cycle"
  | "milestone"
  | "tags"
  | "due"
  | "schedule"
  | "description"
  | "participants"
  | "relations"
  | null;
type DuePickerMode = "date" | null;
type ScheduleQuickSelection = "now" | "tomorrow" | null;

function roundToNextHalfHour(value = new Date()) {
  const next = new Date(value);
  next.setSeconds(0, 0);
  const remainder = next.getMinutes() % 30;
  if (remainder !== 0) next.setMinutes(next.getMinutes() + (30 - remainder));
  return next;
}

function shiftDate(value: Date, amount: number, unit: "day" | "minute") {
  const next = new Date(value);
  if (unit === "day") next.setDate(next.getDate() + amount);
  else next.setMinutes(next.getMinutes() + amount);
  return next;
}

function formatFocusHours(hours: number, language: "vi" | "en") {
  if (hours === 0.5) return language === "vi" ? "30 phút" : "30 min";
  if (hours < 1)
    return language === "vi"
      ? `${Math.round(hours * 60)} phút`
      : `${Math.round(hours * 60)} min`;
  return language === "vi" ? `${hours} giờ` : `${hours} hr`;
}

function mergeDatePart(current: Date, selected: Date) {
  const next = new Date(current);
  next.setFullYear(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
  );
  return next;
}

function formatLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function IssueDetailScreen() {
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const { user, orgId, selectOrganization } = useAuth();
  const { theme: ui, language, resolvedTheme } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const {
    issue,
    projectId,
    statuses,
    members,
    cycles,
    milestones,
    tags,
    comments,
    participants,
    relations,
    refresh,
  } = useIssueDetailData(identifier, orgId);
  const pullRefresh = usePullToRefresh(refresh);

  useEffect(() => {
    const targetOrgId = issue.data?.organization_id;
    if (targetOrgId && targetOrgId !== orgId)
      void selectOrganization(targetOrgId);
  }, [issue.data?.organization_id, orgId, selectOrganization]);

  const update = useUpdateIssue(identifier, issue.data?.version, orgId);
  const moveCycle = useMoveIssueCycle(projectId, issue.data, orgId);
  const addComment = useAddIssueComment(issue.data?.id);
  const deleteComment = useDeleteIssueComment(issue.data?.id);
  const addParticipant = useAddIssueParticipant(identifier, orgId);
  const removeParticipant = useRemoveIssueParticipant(identifier, orgId);
  const addRelation = useCreateIssueRelation(issue.data?.id);
  const deleteRelation = useDeleteIssueRelation(issue.data?.id);
  const schedule = useScheduleIssue(identifier, orgId, issue.data?.project_id);
  const archive = useArchiveIssue(identifier);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [comment, setComment] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState<Date>(() => roundToNextHalfHour());
  const [duePickerMode, setDuePickerMode] = useState<DuePickerMode>(null);
  const [scheduleStart, setScheduleStart] = useState<Date>(() =>
    roundToNextHalfHour(),
  );
  const [scheduleHours, setScheduleHours] = useState(2);
  const [scheduleQuickSelection, setScheduleQuickSelection] =
    useState<ScheduleQuickSelection>("now");
  const [relationIdentifier, setRelationIdentifier] = useState("");
  const [relationType, setRelationType] =
    useState<(typeof relationTypes)[number]>("RELATES_TO");
  const [participantRole, setParticipantRole] =
    useState<ParticipantRole>("OBSERVER");

  const statusName = useMemo(
    () =>
      issue.data?.status?.name ??
      statuses.data?.find((status) => status.id === issue.data?.status_id)
        ?.name ??
      "—",
    [issue.data, statuses.data],
  );

  if (issue.isLoading)
    return (
      <LoadingScreen
        chrome="stack"
        title={language === "vi" ? "Chi tiết công việc" : "Task detail"}
        subtitle={identifier}
      />
    );
  if (!issue.data)
    return (
      <Screen chrome="stack" title={identifier ?? "Issue"}>
        <Text style={{ color: ui.colors.textSecondary }}>Issue not found.</Text>
      </Screen>
    );

  const data = issue.data;
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const selectedTagIds = new Set(
    (data.tags ?? []).map((tag: any) => tag.id ?? tag.tag?.id).filter(Boolean),
  );
  const participantUserIds = new Set(
    (participants.data ?? []).map((participant) => participant.userId),
  );
  const mutationError = (error: unknown) =>
    presentError(
      language === "vi" ? "Không thể cập nhật" : "Update failed",
      error,
    );
  const assigneeName =
    (members.data ?? []).find((member) => member.id === data.assignee_id)
      ?.name ??
    data.assignee?.name ??
    (language === "vi" ? "Chưa giao" : "Unassigned");
  const cycleName =
    (cycles.data ?? []).find((cycle) => cycle.id === data.cycle_id)?.name ??
    (data.cycle_id ? `Cycle` : language === "vi" ? "Không có" : "None");
  const milestoneName =
    (milestones.data ?? []).find(
      (milestone) => milestone.id === data.milestone_id,
    )?.title ?? (language === "vi" ? "Không có" : "None");
  const tagLabel = (data.tags ?? []).length
    ? (data.tags ?? [])
        .map((tag: any) => tag.name ?? tag.tag?.name)
        .filter(Boolean)
        .join(", ")
    : language === "vi"
      ? "Không có"
      : "None";

  const openDescription = () => {
    setDescription(data.description ?? "");
    setSheet("description");
  };

  const openDue = () => {
    const existingDateOnly = data.due_date ? new Date(data.due_date) : null;
    if (existingDateOnly && !Number.isNaN(existingDateOnly.getTime())) {
      setDueAt(existingDateOnly);
    } else {
      setDueAt(roundToNextHalfHour());
    }
    setDuePickerMode(null);
    setSheet("due");
  };

  const openSchedule = () => {
    const existingStart = data.scheduled_start
      ? new Date(data.scheduled_start)
      : null;
    const existingHours = Number(data.focus_hours);
    const hasExistingStart = Boolean(
      existingStart && !Number.isNaN(existingStart.getTime()),
    );
    setScheduleStart(hasExistingStart ? existingStart! : roundToNextHalfHour());
    setScheduleQuickSelection(hasExistingStart ? null : "now");
    setScheduleHours(
      Number.isFinite(existingHours) && existingHours > 0 ? existingHours : 2,
    );
    setSheet("schedule");
  };

  const adjustScheduleStart = (amount: number, unit: "day" | "minute") => {
    setScheduleQuickSelection(null);
    setScheduleStart((current) => shiftDate(current, amount, unit));
  };

  const selectScheduleQuick = (
    selection: Exclude<ScheduleQuickSelection, null>,
  ) => {
    setScheduleQuickSelection(selection);
    setScheduleStart(
      selection === "now"
        ? roundToNextHalfHour()
        : shiftDate(roundToNextHalfHour(), 1, "day"),
    );
  };

  const scheduleEnd = new Date(
    scheduleStart.getTime() + scheduleHours * 60 * 60 * 1000,
  );
  const scheduleDateLabel = scheduleStart.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
  const scheduleTimeLabel = scheduleStart.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const scheduleEndLabel = `${scheduleEnd.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" })} · ${scheduleEnd.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
  const storedDue = data.due_date ? new Date(data.due_date) : null;
  const dueListLabel =
    storedDue && !Number.isNaN(storedDue.getTime())
      ? storedDue.toLocaleDateString(locale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : language === "vi"
        ? "Chưa đặt"
        : "None";
  const dueDateLabel = dueAt.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const duePickerValueLabel = dueAt.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const duePickerLocale = language === "vi" ? "vi_VN" : "en_US";

  const applyDueSelection = (selected: Date) => {
    setDueAt((current) => mergeDatePart(current, selected));
    // Android is dialog-based and closes after confirmation. The iOS compact
    // picker stays mounted, while its visible label is rendered by us below so
    // the date format cannot change after the native picker returns a value.
    if (Platform.OS === "android") setDuePickerMode(null);
  };

  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Chi tiết công việc" : "Task detail"}
      subtitle={data.identifier}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <View style={styles.hero}>
        <Text style={styles.identifier}>{data.identifier}</Text>
        <Text style={styles.issueTitle}>{data.title}</Text>
        <View style={styles.quickMeta}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${language === "vi" ? "Trạng thái" : "Status"}, ${statusName}`}
            onPress={() => setSheet("status")}
            style={styles.quickMetaItem}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusCategoryColor(
                    ui,
                    data.status?.category,
                  ),
                },
              ]}
            />
            <Text style={styles.quickMetaText}>{statusName}</Text>
          </MotionPressable>
          <Text style={styles.quickMetaSeparator}>·</Text>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${language === "vi" ? "Ưu tiên" : "Priority"}, ${data.priority}`}
            onPress={() => setSheet("priority")}
            style={styles.quickMetaItem}
          >
            <Ionicons
              accessible={false}
              name="flag-outline"
              size={14}
              color={priorityColor(ui, data.priority)}
            />
            <Text
              style={[
                styles.quickMetaText,
                { color: priorityColor(ui, data.priority) },
              ]}
            >
              {data.priority}
            </Text>
          </MotionPressable>
        </View>
      </View>

      <SectionHeader
        title={language === "vi" ? "Mô tả" : "Description"}
        right={
          <MotionPressable onPress={openDescription} style={styles.textAction}>
            <Ionicons
              name="create-outline"
              size={16}
              color={ui.colors.accent}
            />
            <Text style={styles.textActionLabel}>
              {language === "vi" ? "Sửa" : "Edit"}
            </Text>
          </MotionPressable>
        }
      />
      <View style={styles.descriptionSurface}>
        {data.description ? (
          <Markdown
            style={{
              body: {
                color: ui.colors.textSecondary,
                fontSize: 14,
                lineHeight: 22,
              },
              heading1: { color: ui.colors.text },
              heading2: { color: ui.colors.text },
              heading3: { color: ui.colors.text },
              code_inline: {
                color: ui.colors.text,
                backgroundColor: ui.colors.surfaceRaised,
              },
            }}
          >
            {data.description}
          </Markdown>
        ) : (
          <Text style={styles.emptyCopy}>
            {language === "vi" ? "Chưa có mô tả." : "No description yet."}
          </Text>
        )}
      </View>

      <SectionHeader title={language === "vi" ? "Chi tiết" : "Details"} />
      <ListGroup variant="plain">
        <ListRow
          first
          icon="people-outline"
          label={language === "vi" ? "Người phụ trách" : "Assignee"}
          value={assigneeName}
          onPress={() => setSheet("assignee")}
        />
        <ListRow
          icon="calendar-outline"
          label={language === "vi" ? "Hạn hoàn thành" : "Due date"}
          value={dueListLabel}
          onPress={openDue}
        />
      </ListGroup>

      <SectionHeader
        title={language === "vi" ? "Bình luận" : "Comments"}
        caption={`${comments.data?.length ?? 0}`}
      />
      <View style={styles.comments}>
        {(comments.data ?? []).map((item) => (
          <View key={item.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {(item.author?.name ?? item.author_id ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>
                  {item.author?.name ?? item.author_id}
                </Text>
                <Text style={styles.commentTime}>
                  {new Date(item.created_at).toLocaleString(locale)}
                </Text>
              </View>
              <Text style={styles.commentText}>{item.body}</Text>
              {item.author_id === user?.id ? (
                <MotionPressable
                  onPress={() =>
                    deleteComment.mutate(item.id, { onError: mutationError })
                  }
                >
                  <Text style={styles.deleteText}>
                    {language === "vi" ? "Xóa" : "Delete"}
                  </Text>
                </MotionPressable>
              ) : null}
            </View>
          </View>
        ))}
        {(comments.data ?? []).length === 0 ? (
          <Text style={styles.emptyCopy}>
            {language === "vi" ? "Chưa có bình luận." : "No comments yet."}
          </Text>
        ) : null}
      </View>
      <View style={styles.composer}>
        <Field
          multiline
          placeholder={
            language === "vi" ? "Viết bình luận…" : "Write a comment…"
          }
          value={comment}
          onChangeText={setComment}
          style={styles.commentField}
        />
        <MotionPressable
          disabled={!comment.trim() || addComment.isPending}
          onPress={() =>
            addComment.mutate(comment.trim(), {
              onSuccess: () => setComment(""),
              onError: mutationError,
            })
          }
          style={[
            styles.sendButton,
            (!comment.trim() || addComment.isPending) && styles.sendDisabled,
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={ui.colors.inverseText} />
        </MotionPressable>
      </View>

      <SectionHeader
        title={language === "vi" ? "Thông tin khác" : "More details"}
      />
      <ListGroup variant="plain">
        <ListRow
          first
          icon="repeat-outline"
          label="Cycle"
          value={cycleName}
          onPress={() => setSheet("cycle")}
        />
        <ListRow
          icon="trophy-outline"
          label="Milestone"
          value={milestoneName}
          onPress={() => setSheet("milestone")}
        />
        <ListRow
          icon="pricetags-outline"
          label="Tags"
          value={tagLabel}
          onPress={() => setSheet("tags")}
        />
        <ListRow
          icon="time-outline"
          label={language === "vi" ? "Lịch tập trung" : "Focus schedule"}
          value={
            data.scheduled_start
              ? `${new Date(data.scheduled_start).toLocaleString(locale)} · ${formatFocusHours(Number(data.focus_hours ?? 0), language)}`
              : language === "vi"
                ? "Chưa xếp"
                : "Not scheduled"
          }
          onPress={openSchedule}
        />
      </ListGroup>

      <SectionHeader title={language === "vi" ? "Thêm" : "More"} />
      <ListGroup variant="plain">
        <ListRow
          first
          icon="people-outline"
          label={language === "vi" ? "Người tham gia" : "Participants"}
          value={`${participants.data?.length ?? 0}`}
          onPress={() => setSheet("participants")}
        />
        <ListRow
          icon="git-compare-outline"
          label={language === "vi" ? "Liên kết issue" : "Relations"}
          value={`${relations.data?.length ?? 0}`}
          onPress={() => setSheet("relations")}
        />
        <ListRow
          icon="archive-outline"
          label={language === "vi" ? "Lưu trữ issue" : "Archive issue"}
          danger
          onPress={() =>
            showAppAlert(
              language === "vi" ? "Lưu trữ issue?" : "Archive issue?",
              data.identifier,
              [
                { text: language === "vi" ? "Hủy" : "Cancel" },
                {
                  text: language === "vi" ? "Lưu trữ" : "Archive",
                  style: "destructive",
                  onPress: () =>
                    archive.mutate(undefined, {
                      onSuccess: () => router.back(),
                      onError: mutationError,
                    }),
                },
              ],
            )
          }
        />
      </ListGroup>

      <BottomSheet
        visible={sheet === "status"}
        title={language === "vi" ? "Trạng thái" : "Status"}
        onClose={() => setSheet(null)}
      >
        {(statuses.data ?? []).map((status) => (
          <ChoiceRow
            key={status.id}
            label={status.name}
            active={data.status_id === status.id}
            onPress={() =>
              update.mutate(
                { statusId: status.id },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "priority"}
        title={language === "vi" ? "Ưu tiên" : "Priority"}
        onClose={() => setSheet(null)}
      >
        {priorities.map((priority) => (
          <ChoiceRow
            key={priority}
            label={priority}
            active={data.priority === priority}
            onPress={() =>
              update.mutate(
                { priority },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "assignee"}
        title="Assignee"
        onClose={() => setSheet(null)}
      >
        <ChoiceRow
          label={language === "vi" ? "Chưa giao" : "Unassigned"}
          active={!data.assignee_id}
          onPress={() =>
            update.mutate(
              { assigneeId: null },
              { onSuccess: () => setSheet(null), onError: mutationError },
            )
          }
        />
        {(members.data ?? []).map((member) => (
          <ChoiceRow
            key={member.id}
            label={member.name}
            active={data.assignee_id === member.id}
            onPress={() =>
              update.mutate(
                { assigneeId: member.id },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "cycle"}
        title="Cycle"
        onClose={() => setSheet(null)}
      >
        <ChoiceRow
          label={language === "vi" ? "Không có cycle" : "No cycle"}
          active={!data.cycle_id}
          onPress={() =>
            moveCycle.mutate(null, {
              onSuccess: () => setSheet(null),
              onError: mutationError,
            })
          }
        />
        {(cycles.data ?? []).map((cycle) => (
          <ChoiceRow
            key={cycle.id}
            label={cycle.name || `Cycle ${cycle.number}`}
            active={data.cycle_id === cycle.id}
            onPress={() =>
              moveCycle.mutate(cycle.id, {
                onSuccess: () => setSheet(null),
                onError: mutationError,
              })
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "milestone"}
        title="Milestone"
        onClose={() => setSheet(null)}
      >
        <ChoiceRow
          label={language === "vi" ? "Không có milestone" : "No milestone"}
          active={!data.milestone_id}
          onPress={() =>
            update.mutate(
              { milestoneId: null },
              { onSuccess: () => setSheet(null), onError: mutationError },
            )
          }
        />
        {(milestones.data ?? []).map((milestone) => (
          <ChoiceRow
            key={milestone.id}
            label={milestone.title}
            active={data.milestone_id === milestone.id}
            onPress={() =>
              update.mutate(
                { milestoneId: milestone.id },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "tags"}
        title="Tags"
        subtitle={language === "vi" ? "Có thể chọn nhiều" : "Select multiple"}
        onClose={() => setSheet(null)}
      >
        {(tags.data ?? []).map((tag: any) => (
          <ChoiceRow
            key={tag.id}
            label={tag.name}
            active={selectedTagIds.has(tag.id)}
            onPress={() => {
              const next = new Set(selectedTagIds);
              if (next.has(tag.id)) next.delete(tag.id);
              else next.add(tag.id);
              update.mutate({ tagIds: [...next] }, { onError: mutationError });
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "due"}
        title={language === "vi" ? "Hạn hoàn thành" : "Due date"}
        subtitle={
          language === "vi"
            ? "Chọn ngày công việc cần hoàn tất."
            : "Choose the date this task should be completed."
        }
        onClose={() => {
          setDuePickerMode(null);
          setSheet(null);
        }}
        footer={
          <View style={styles.dueFooter}>
            <Button
              title={language === "vi" ? "Lưu hạn hoàn thành" : "Save due date"}
              disabled={update.isPending}
              onPress={() =>
                update.mutate(
                  { dueDate: formatLocalDateKey(dueAt) },
                  {
                    onSuccess: () => {
                      setDuePickerMode(null);
                      setSheet(null);
                    },
                    onError: mutationError,
                  },
                )
              }
            />
            {data.due_date ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={
                  language === "vi" ? "Xóa hạn hoàn thành" : "Clear due date"
                }
                disabled={update.isPending}
                onPress={() =>
                  update.mutate(
                    { dueDate: null },
                    {
                      onSuccess: () => {
                        setDuePickerMode(null);
                        setSheet(null);
                      },
                      onError: mutationError,
                    },
                  )
                }
                style={styles.dueClearButton}
              >
                <Text style={styles.dueClearText}>
                  {language === "vi" ? "Xóa hạn hoàn thành" : "Clear due date"}
                </Text>
              </MotionPressable>
            ) : null}
          </View>
        }
      >
        <View style={styles.dueSummary}>
          <View style={styles.dueSummaryIcon}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={ui.colors.accentStrong}
            />
          </View>
          <View style={styles.dueSummaryCopy}>
            <Text style={styles.dueSummaryEyebrow}>
              {language === "vi" ? "SẼ ĐẾN HẠN" : "DUE"}
            </Text>
            <Text style={styles.dueSummaryDate}>{dueDateLabel}</Text>
          </View>
        </View>

        <View style={styles.duePickerGroup}>
          <View style={styles.duePickerRow}>
            <View style={styles.duePickerLabelGroup}>
              <View style={styles.dueRowIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={ui.colors.textSecondary}
                />
              </View>
              <Text style={styles.duePickerLabel}>
                {language === "vi" ? "Ngày" : "Date"}
              </Text>
            </View>
            {Platform.OS === "ios" ? (
              <View style={styles.dueCompactPickerControl}>
                <NativeDateTimePicker
                  value={dueAt}
                  mode="date"
                  display="compact"
                  locale={duePickerLocale}
                  themeVariant={resolvedTheme}
                  accentColor={ui.colors.accentStrong}
                  onValueChange={(_, selected) => applyDueSelection(selected)}
                  style={styles.dueCompactPickerNative}
                />
                <View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.dueCompactPickerLabel}
                >
                  <Text style={styles.duePickerValue}>
                    {duePickerValueLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={ui.colors.textMuted}
                  />
                </View>
              </View>
            ) : (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={`${language === "vi" ? "Chọn ngày" : "Choose date"}, ${duePickerValueLabel}`}
                onPress={() => setDuePickerMode("date")}
                style={styles.duePickerValueButton}
              >
                <Text style={styles.duePickerValue}>{duePickerValueLabel}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={ui.colors.textMuted}
                />
              </MotionPressable>
            )}
          </View>
        </View>

        <View style={styles.dueQuickActions}>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => {
              const next = new Date();
              setDueAt(next);
              setDuePickerMode(null);
            }}
            style={styles.dueQuickAction}
          >
            <Text style={styles.dueQuickText}>
              {language === "vi" ? "Hôm nay" : "Today"}
            </Text>
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => {
              const next = new Date();
              next.setDate(next.getDate() + 1);
              setDueAt(next);
              setDuePickerMode(null);
            }}
            style={styles.dueQuickAction}
          >
            <Text style={styles.dueQuickText}>
              {language === "vi" ? "Ngày mai" : "Tomorrow"}
            </Text>
          </MotionPressable>
        </View>

        {/* Expo UI's Android dialog picker mounts a Compose Host. Keep that host
            out of the ScrollView flow so opening the native dialog cannot remeasure
            the bottom-sheet content and shift the Date/quick-action spacing. */}
        {Platform.OS === "android" && duePickerMode ? (
          <NativeDateTimePicker
            value={dueAt}
            mode={duePickerMode}
            presentation="dialog"
            display="default"
            is24Hour
            accentColor={ui.colors.accentStrong}
            positiveButton={{ label: language === "vi" ? "Chọn" : "Select" }}
            negativeButton={{ label: language === "vi" ? "Hủy" : "Cancel" }}
            onValueChange={(_, selected) => applyDueSelection(selected)}
            onDismiss={() => setDuePickerMode(null)}
            style={styles.androidDateDialogHost}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "schedule"}
        title={language === "vi" ? "Xếp lịch công việc" : "Schedule task"}
        subtitle={
          language === "vi"
            ? "Chọn thời gian bắt đầu và thời lượng tập trung."
            : "Choose when to start and how long to focus."
        }
        onClose={() => setSheet(null)}
        footer={
          <Button
            title={language === "vi" ? "Xếp lịch" : "Schedule"}
            disabled={scheduleHours <= 0 || schedule.isPending}
            onPress={() =>
              schedule.mutate(
                {
                  startsAt: scheduleStart.toISOString(),
                  durationHours: scheduleHours,
                },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        }
      >
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleLabel}>
            {language === "vi" ? "Bắt đầu" : "Start"}
          </Text>
          <View style={styles.schedulePickerRow}>
            <View style={styles.schedulePickerCard}>
              <View style={styles.schedulePickerHeading}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={ui.colors.textMuted}
                />
                <Text style={styles.schedulePickerCaption}>
                  {language === "vi" ? "Ngày" : "Date"}
                </Text>
              </View>
              <Text style={styles.schedulePickerValue}>
                {scheduleDateLabel}
              </Text>
              <View style={styles.scheduleStepper}>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === "vi" ? "Ngày trước" : "Previous day"
                  }
                  onPress={() => adjustScheduleStart(-1, "day")}
                  style={styles.scheduleStepButton}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={ui.colors.text}
                  />
                </MotionPressable>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === "vi" ? "Ngày sau" : "Next day"
                  }
                  onPress={() => adjustScheduleStart(1, "day")}
                  style={styles.scheduleStepButton}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={ui.colors.text}
                  />
                </MotionPressable>
              </View>
            </View>

            <View style={styles.schedulePickerCard}>
              <View style={styles.schedulePickerHeading}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color={ui.colors.textMuted}
                />
                <Text style={styles.schedulePickerCaption}>
                  {language === "vi" ? "Giờ" : "Time"}
                </Text>
              </View>
              <Text style={styles.schedulePickerValue}>
                {scheduleTimeLabel}
              </Text>
              <View style={styles.scheduleStepper}>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === "vi" ? "Lùi 30 phút" : "30 minutes earlier"
                  }
                  onPress={() => adjustScheduleStart(-30, "minute")}
                  style={styles.scheduleStepButton}
                >
                  <Ionicons name="remove" size={19} color={ui.colors.text} />
                </MotionPressable>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    language === "vi" ? "Thêm 30 phút" : "30 minutes later"
                  }
                  onPress={() => adjustScheduleStart(30, "minute")}
                  style={styles.scheduleStepButton}
                >
                  <Ionicons name="add" size={19} color={ui.colors.text} />
                </MotionPressable>
              </View>
            </View>
          </View>

          <View style={styles.scheduleQuickRow}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{
                selected: scheduleQuickSelection === "now",
              }}
              onPress={() => selectScheduleQuick("now")}
              style={[
                styles.scheduleQuickButton,
                scheduleQuickSelection === "now" &&
                  styles.scheduleQuickButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.scheduleQuickText,
                  scheduleQuickSelection === "now" &&
                    styles.scheduleQuickTextActive,
                ]}
              >
                {language === "vi" ? "Bây giờ" : "Now"}
              </Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              accessibilityState={{
                selected: scheduleQuickSelection === "tomorrow",
              }}
              onPress={() => selectScheduleQuick("tomorrow")}
              style={[
                styles.scheduleQuickButton,
                scheduleQuickSelection === "tomorrow" &&
                  styles.scheduleQuickButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.scheduleQuickText,
                  scheduleQuickSelection === "tomorrow" &&
                    styles.scheduleQuickTextActive,
                ]}
              >
                {language === "vi" ? "Ngày mai" : "Tomorrow"}
              </Text>
            </MotionPressable>
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleLabel}>
            {language === "vi" ? "Thời lượng" : "Duration"}
          </Text>
          <View style={styles.scheduleDurationOptions}>
            {scheduleDurationOptions.map((hours) => {
              const active = scheduleHours === hours;
              return (
                <MotionPressable
                  key={hours}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setScheduleHours(hours)}
                  style={[
                    styles.scheduleDurationChip,
                    active && styles.scheduleDurationChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.scheduleDurationText,
                      active && styles.scheduleDurationTextActive,
                    ]}
                  >
                    {formatFocusHours(hours, language)}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
          <View style={styles.scheduleDurationAdjuster}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                language === "vi"
                  ? "Giảm thời lượng 30 phút"
                  : "Reduce duration by 30 minutes"
              }
              disabled={scheduleHours <= 0.5}
              onPress={() =>
                setScheduleHours((hours) => Math.max(0.5, hours - 0.5))
              }
              style={[
                styles.scheduleAdjustButton,
                scheduleHours <= 0.5 && styles.scheduleAdjustButtonDisabled,
              ]}
            >
              <Ionicons name="remove" size={20} color={ui.colors.text} />
            </MotionPressable>
            <View style={styles.scheduleDurationValue}>
              <Text style={styles.scheduleDurationValueLabel}>
                {language === "vi" ? "Tùy chỉnh" : "Custom"}
              </Text>
              <Text style={styles.scheduleDurationValueText}>
                {formatFocusHours(scheduleHours, language)}
              </Text>
            </View>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                language === "vi"
                  ? "Tăng thời lượng 30 phút"
                  : "Increase duration by 30 minutes"
              }
              onPress={() => setScheduleHours((hours) => hours + 0.5)}
              style={styles.scheduleAdjustButton}
            >
              <Ionicons name="add" size={20} color={ui.colors.text} />
            </MotionPressable>
          </View>
        </View>

        <View style={styles.scheduleSummary}>
          <View style={styles.scheduleSummaryIcon}>
            <Ionicons
              name="checkmark"
              size={18}
              color={ui.colors.accentStrong}
            />
          </View>
          <View style={styles.scheduleSummaryCopy}>
            <Text style={styles.scheduleSummaryLabel}>
              {language === "vi" ? "Kết thúc" : "Ends"}
            </Text>
            <Text style={styles.scheduleSummaryValue}>{scheduleEndLabel}</Text>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === "description"}
        title={language === "vi" ? "Sửa mô tả" : "Edit description"}
        onClose={() => setSheet(null)}
        footer={
          <Button
            title={language === "vi" ? "Lưu mô tả" : "Save description"}
            onPress={() =>
              update.mutate(
                { description },
                { onSuccess: () => setSheet(null), onError: mutationError },
              )
            }
          />
        }
      >
        <Field
          multiline
          value={description}
          onChangeText={setDescription}
          style={{ minHeight: 180 }}
        />
      </BottomSheet>

      <BottomSheet
        visible={sheet === "participants"}
        title={language === "vi" ? "Người tham gia" : "Participants"}
        onClose={() => setSheet(null)}
      >
        {(participants.data ?? []).map((participant) => (
          <View key={participant.id} style={styles.manageRow}>
            <View style={styles.manageCopy}>
              <Text style={styles.manageTitle}>{participant.name}</Text>
              <Text style={styles.manageDetail}>{participant.role}</Text>
            </View>
            <MotionPressable
              onPress={() =>
                removeParticipant.mutate(participant.id, {
                  onError: mutationError,
                })
              }
            >
              <Text style={styles.deleteText}>
                {language === "vi" ? "Xóa" : "Remove"}
              </Text>
            </MotionPressable>
          </View>
        ))}
        <Text style={styles.sheetLabel}>
          {language === "vi" ? "Vai trò khi thêm" : "Role for new participant"}
        </Text>
        {participantRoles.map((role) => (
          <ChoiceRow
            key={role}
            label={role}
            active={participantRole === role}
            onPress={() => setParticipantRole(role)}
          />
        ))}
        <Text style={styles.sheetLabel}>
          {language === "vi" ? "Thêm thành viên" : "Add member"}
        </Text>
        {(members.data ?? [])
          .filter((member) => !participantUserIds.has(member.id))
          .map((member) => (
            <ChoiceRow
              key={member.id}
              label={member.name}
              onPress={() =>
                addParticipant.mutate(
                  { userId: member.id, role: participantRole },
                  { onError: mutationError },
                )
              }
            />
          ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "relations"}
        title={language === "vi" ? "Liên kết issue" : "Issue relations"}
        onClose={() => setSheet(null)}
        footer={
          <Button
            title={language === "vi" ? "Thêm liên kết" : "Add relation"}
            disabled={!relationIdentifier.trim() || addRelation.isPending}
            onPress={() =>
              addRelation.mutate(
                {
                  targetIdentifier: relationIdentifier.trim(),
                  type: relationType,
                },
                {
                  onSuccess: () => setRelationIdentifier(""),
                  onError: mutationError,
                },
              )
            }
          />
        }
      >
        {(relations.data ?? []).map((relation) => (
          <View key={relation.id} style={styles.manageRow}>
            <View style={styles.manageCopy}>
              <Text style={styles.manageTitle}>{relation.type}</Text>
              <Text style={styles.manageDetail}>
                {relation.source_issue?.identifier ?? relation.source_issue_id}{" "}
                →{" "}
                {relation.target_issue?.identifier ?? relation.target_issue_id}
              </Text>
            </View>
            <MotionPressable
              onPress={() =>
                deleteRelation.mutate(relation.id, { onError: mutationError })
              }
            >
              <Text style={styles.deleteText}>
                {language === "vi" ? "Xóa" : "Delete"}
              </Text>
            </MotionPressable>
          </View>
        ))}
        <Field
          autoCapitalize="characters"
          placeholder="AIPM-42"
          value={relationIdentifier}
          onChangeText={setRelationIdentifier}
        />
        {relationTypes.map((type) => (
          <ChoiceRow
            key={type}
            label={type}
            active={relationType === type}
            onPress={() => setRelationType(type)}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    appBarButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surface,
    },
    appBarTitle: { color: ui.colors.text, ...ui.typography.heading },
    hero: { gap: 8, paddingTop: 7, paddingBottom: 4 },
    identifier: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    issueTitle: {
      color: ui.colors.text,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "700",
      letterSpacing: -0.75,
    },
    quickMeta: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 7,
    },
    quickMetaItem: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    quickMetaText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    quickMetaSeparator: { color: ui.colors.textMuted, fontSize: 12 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    textAction: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: ui.colors.accentSoft,
    },
    textActionLabel: {
      color: ui.colors.accent,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    descriptionSurface: { paddingVertical: 4, paddingHorizontal: 1 },
    emptyCopy: { color: ui.colors.textMuted, ...ui.typography.body },
    comments: { gap: 16, paddingHorizontal: 2 },
    commentItem: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    commentAvatarText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "700",
    },
    commentBody: { flex: 1, minWidth: 0, gap: 4 },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    commentAuthor: {
      flex: 1,
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
    },
    commentTime: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 10.5,
    },
    commentText: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      lineHeight: 21,
    },
    deleteText: {
      color: ui.colors.danger,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingTop: 4,
    },
    commentField: { flex: 1, minHeight: 48, maxHeight: 120 },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentStrong,
    },
    sendDisabled: { opacity: 0.4 },
    sheetButtons: { flexDirection: "row", gap: 8 },
    dueFooter: { gap: 4 },
    dueClearButton: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: ui.radius.sm,
    },
    dueClearText: {
      color: ui.colors.danger,
      ...ui.typography.bodyStrong,
      fontSize: 14,
    },
    dueSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingVertical: 6,
    },
    dueSummaryIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
    },
    dueSummaryCopy: { flex: 1, minWidth: 0 },
    dueSummaryEyebrow: {
      color: ui.colors.textMuted,
      ...ui.typography.eyebrow,
      marginBottom: 3,
    },
    dueSummaryDate: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 16,
    },
    duePickerGroup: {
      overflow: "hidden",
      borderRadius: ui.radius.lg,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    duePickerRow: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 13,
    },
    duePickerLabelGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    dueRowIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    duePickerLabel: { color: ui.colors.text, ...ui.typography.bodyStrong },
    duePickerValueButton: {
      minHeight: Platform.OS === "android" ? 48 : 44,
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
      paddingLeft: 12,
    },
    duePickerValue: {
      color: ui.colors.accentStrong,
      ...ui.typography.bodyStrong,
    },
    dueCompactPickerControl: {
      width: 138,
      height: 44,
      flexShrink: 0,
      position: "relative",
    },
    dueCompactPickerNative: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    dueCompactPickerLabel: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
      backgroundColor: ui.colors.surface,
    },
    dueQuickActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 2,
    },
    androidDateDialogHost: {
      position: "absolute",
      width: 0,
      height: 0,
    },
    dueQuickAction: {
      minHeight: Platform.OS === "android" ? 48 : 44,
      justifyContent: "center",
      paddingHorizontal: 13,
      borderRadius: ui.radius.sm,
      backgroundColor: ui.colors.surfaceRaised,
    },
    dueQuickText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    scheduleSection: { gap: 10 },
    scheduleLabel: { color: ui.colors.text, ...ui.typography.bodyStrong },
    schedulePickerRow: { flexDirection: "row", gap: 10 },
    schedulePickerCard: {
      flex: 1,
      minWidth: 0,
      gap: 8,
      padding: 12,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    schedulePickerHeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    schedulePickerCaption: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
    },
    schedulePickerValue: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 16,
    },
    scheduleStepper: { flexDirection: "row", gap: 8 },
    scheduleStepButton: {
      minWidth: 44,
      minHeight: 44,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: ui.radius.sm,
      backgroundColor: ui.colors.surfaceRaised,
    },
    scheduleQuickRow: { flexDirection: "row", gap: 8 },
    scheduleQuickButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: ui.radius.sm,
      backgroundColor: ui.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "transparent",
    },
    scheduleQuickButtonActive: {
      backgroundColor: ui.colors.accentSoft,
      borderColor: ui.colors.accent,
    },
    scheduleQuickText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    scheduleQuickTextActive: { color: ui.colors.accentStrong },
    scheduleDurationOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    scheduleDurationChip: {
      minHeight: 44,
      minWidth: 76,
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      borderRadius: ui.radius.sm,
      backgroundColor: ui.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "transparent",
    },
    scheduleDurationChipActive: {
      backgroundColor: ui.colors.accentSoft,
      borderColor: ui.colors.accent,
    },
    scheduleDurationText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "600",
    },
    scheduleDurationTextActive: { color: ui.colors.accentStrong },
    scheduleDurationAdjuster: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 7,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.surface,
    },
    scheduleAdjustButton: {
      width: Platform.OS === "android" ? 48 : 44,
      height: Platform.OS === "android" ? 48 : 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: ui.radius.sm,
      backgroundColor: ui.colors.surfaceRaised,
    },
    scheduleAdjustButtonDisabled: { opacity: 0.35 },
    scheduleDurationValue: { flex: 1, alignItems: "center" },
    scheduleDurationValueLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
    },
    scheduleDurationValueText: {
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      marginTop: 1,
    },
    scheduleSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 13,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.accentSoft,
    },
    scheduleSummaryIcon: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      backgroundColor: ui.colors.bgElevated,
    },
    scheduleSummaryCopy: { flex: 1, minWidth: 0 },
    scheduleSummaryLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
    },
    scheduleSummaryValue: {
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      marginTop: 1,
    },
    manageRow: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ui.colors.border,
    },
    manageCopy: { flex: 1, minWidth: 0 },
    manageTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
    manageDetail: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    sheetLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.eyebrow,
      marginTop: 8,
      marginBottom: 2,
    },
  });
