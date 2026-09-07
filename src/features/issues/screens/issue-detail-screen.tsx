import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Markdown from '@ronradtke/react-native-markdown-display';
import { Button, Field } from '@/shared/components/ui/primitives';
import { BottomSheet, ChoiceRow, ListGroup, ListRow, SectionHeader } from '@/shared/components/ui/mobile';
import { MotionPressable, SoftFade } from '@/shared/components/ui/motion';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import type { ParticipantRole, Priority } from '@/shared/contracts';
import { useIssueDetailData } from '../queries/use-issue-detail-data';
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
} from '../mutations/use-issue-detail-mutations';

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const participantRoles: ParticipantRole[] = ['ASSIGNEE', 'REVIEWER', 'NEXT_REVIEWER', 'OBSERVER'];
const relationTypes = ['BLOCKS', 'RELATES_TO', 'DUPLICATES'] as const;
type Sheet = 'status' | 'priority' | 'assignee' | 'cycle' | 'milestone' | 'tags' | 'due' | 'schedule' | 'description' | 'participants' | 'relations' | null;

export default function IssueDetailScreen() {
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const { user, orgId, selectOrganization } = useAuth();
  const { theme: ui, language } = useAppPreferences();
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

  useEffect(() => {
    const targetOrgId = issue.data?.organization_id;
    if (targetOrgId && targetOrgId !== orgId) void selectOrganization(targetOrgId);
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
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleHours, setScheduleHours] = useState('2');
  const [relationIdentifier, setRelationIdentifier] = useState('');
  const [relationType, setRelationType] = useState<(typeof relationTypes)[number]>('RELATES_TO');
  const [participantRole, setParticipantRole] = useState<ParticipantRole>('OBSERVER');

  const statusName = useMemo(
    () => issue.data?.status?.name ?? statuses.data?.find((status) => status.id === issue.data?.status_id)?.name ?? '—',
    [issue.data, statuses.data],
  );

  if (issue.isLoading) return <LoadingScreen chrome="stack" title={language === 'vi' ? 'Chi tiết công việc' : 'Task detail'} subtitle={identifier} />;
  if (!issue.data) return <Screen chrome="stack" title={identifier ?? 'Issue'}><Text style={{ color: ui.colors.textSecondary }}>Issue not found.</Text></Screen>;

  const data = issue.data;
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const selectedTagIds = new Set((data.tags ?? []).map((tag: any) => tag.id ?? tag.tag?.id).filter(Boolean));
  const participantUserIds = new Set((participants.data ?? []).map((participant) => participant.userId));
  const mutationError = (error: unknown) => presentError(language === 'vi' ? 'Không thể cập nhật' : 'Update failed', error);
  const assigneeName = (members.data ?? []).find((member) => member.id === data.assignee_id)?.name ?? data.assignee?.name ?? (language === 'vi' ? 'Chưa giao' : 'Unassigned');
  const cycleName = (cycles.data ?? []).find((cycle) => cycle.id === data.cycle_id)?.name ?? (data.cycle_id ? `Cycle` : (language === 'vi' ? 'Không có' : 'None'));
  const milestoneName = (milestones.data ?? []).find((milestone) => milestone.id === data.milestone_id)?.title ?? (language === 'vi' ? 'Không có' : 'None');
  const tagLabel = (data.tags ?? []).length ? (data.tags ?? []).map((tag: any) => tag.name ?? tag.tag?.name).filter(Boolean).join(', ') : (language === 'vi' ? 'Không có' : 'None');

  const openDescription = () => {
    setDescription(data.description ?? '');
    setSheet('description');
  };

  return (
    <Screen
      chrome="stack"
      title={language === 'vi' ? 'Chi tiết công việc' : 'Task detail'}
      subtitle={data.identifier}
      refreshing={issue.isRefetching}
      onRefresh={() => void refresh()}
    >
      <SoftFade style={styles.hero}>
        <Text style={styles.identifier}>{data.identifier}</Text>
        <Text style={styles.issueTitle}>{data.title}</Text>
        <View style={styles.quickMeta}>
          <MotionPressable accessibilityRole="button" accessibilityLabel={`${language === 'vi' ? 'Trạng thái' : 'Status'}, ${statusName}`} onPress={() => setSheet('status')} style={styles.quickMetaItem}>
            <View style={styles.statusDot} />
            <Text style={styles.quickMetaText}>{statusName}</Text>
          </MotionPressable>
          <Text style={styles.quickMetaSeparator}>·</Text>
          <MotionPressable accessibilityRole="button" accessibilityLabel={`${language === 'vi' ? 'Ưu tiên' : 'Priority'}, ${data.priority}`} onPress={() => setSheet('priority')} style={styles.quickMetaItem}>
            <Ionicons accessible={false} name="flag-outline" size={14} color={(data.priority === 'HIGH' || data.priority === 'URGENT') ? ui.colors.warning : ui.colors.textMuted} />
            <Text style={[styles.quickMetaText, (data.priority === 'HIGH' || data.priority === 'URGENT') && styles.quickMetaWarning]}>{data.priority}</Text>
          </MotionPressable>
        </View>
      </SoftFade>

      <SectionHeader title={language === 'vi' ? 'Mô tả' : 'Description'} right={<MotionPressable onPress={openDescription} style={styles.textAction}><Ionicons name="create-outline" size={16} color={ui.colors.accent} /><Text style={styles.textActionLabel}>{language === 'vi' ? 'Sửa' : 'Edit'}</Text></MotionPressable>} />
      <View style={styles.descriptionSurface}>
        {data.description ? (
          <Markdown style={{ body: { color: ui.colors.textSecondary, fontSize: 14, lineHeight: 22 }, heading1: { color: ui.colors.text }, heading2: { color: ui.colors.text }, heading3: { color: ui.colors.text }, code_inline: { color: ui.colors.text, backgroundColor: ui.colors.surfaceRaised } }}>
            {data.description}
          </Markdown>
        ) : <Text style={styles.emptyCopy}>{language === 'vi' ? 'Chưa có mô tả.' : 'No description yet.'}</Text>}
      </View>

      <SectionHeader title={language === 'vi' ? 'Chi tiết' : 'Details'} />
      <ListGroup variant="plain">
        <ListRow first icon="people-outline" label={language === 'vi' ? 'Người phụ trách' : 'Assignee'} value={assigneeName} onPress={() => setSheet('assignee')} />
        <ListRow icon="calendar-outline" label={language === 'vi' ? 'Hạn hoàn thành' : 'Due date'} value={data.due_date ? new Date(data.due_date).toLocaleDateString(locale) : (language === 'vi' ? 'Chưa đặt' : 'None')} onPress={() => setSheet('due')} />
      </ListGroup>

      <SectionHeader title={language === 'vi' ? 'Bình luận' : 'Comments'} caption={`${comments.data?.length ?? 0}`} />
      <View style={styles.comments}>
        {(comments.data ?? []).map((item) => (
          <View key={item.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{(item.author?.name ?? item.author_id ?? '?').charAt(0).toUpperCase()}</Text></View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{item.author?.name ?? item.author_id}</Text>
                <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleString(locale)}</Text>
              </View>
              <Text style={styles.commentText}>{item.body}</Text>
              {item.author_id === user?.id ? <MotionPressable onPress={() => deleteComment.mutate(item.id, { onError: mutationError })}><Text style={styles.deleteText}>{language === 'vi' ? 'Xóa' : 'Delete'}</Text></MotionPressable> : null}
            </View>
          </View>
        ))}
        {(comments.data ?? []).length === 0 ? <Text style={styles.emptyCopy}>{language === 'vi' ? 'Chưa có bình luận.' : 'No comments yet.'}</Text> : null}
      </View>
      <View style={styles.composer}>
        <Field multiline placeholder={language === 'vi' ? 'Viết bình luận…' : 'Write a comment…'} value={comment} onChangeText={setComment} style={styles.commentField} />
        <MotionPressable disabled={!comment.trim() || addComment.isPending} onPress={() => addComment.mutate(comment.trim(), { onSuccess: () => setComment(''), onError: mutationError })} style={[styles.sendButton, (!comment.trim() || addComment.isPending) && styles.sendDisabled]}>
          <Ionicons name="arrow-up" size={20} color={ui.colors.inverseText} />
        </MotionPressable>
      </View>

      <SectionHeader title={language === 'vi' ? 'Thông tin khác' : 'More details'} />
      <ListGroup variant="plain">
        <ListRow first icon="repeat-outline" label="Cycle" value={cycleName} onPress={() => setSheet('cycle')} />
        <ListRow icon="trophy-outline" label="Milestone" value={milestoneName} onPress={() => setSheet('milestone')} />
        <ListRow icon="pricetags-outline" label="Tags" value={tagLabel} onPress={() => setSheet('tags')} />
        <ListRow icon="time-outline" label={language === 'vi' ? 'Lịch tập trung' : 'Focus schedule'} value={data.scheduled_start ? `${new Date(data.scheduled_start).toLocaleString(locale)} · ${Number(data.focus_hours ?? 0)}h` : (language === 'vi' ? 'Chưa xếp' : 'Not scheduled')} onPress={() => setSheet('schedule')} />
      </ListGroup>

      <SectionHeader title={language === 'vi' ? 'Thêm' : 'More'} />
      <ListGroup variant="plain">
        <ListRow first icon="people-outline" label={language === 'vi' ? 'Người tham gia' : 'Participants'} value={`${participants.data?.length ?? 0}`} onPress={() => setSheet('participants')} />
        <ListRow icon="git-compare-outline" label={language === 'vi' ? 'Liên kết issue' : 'Relations'} value={`${relations.data?.length ?? 0}`} onPress={() => setSheet('relations')} />
        <ListRow icon="archive-outline" label={language === 'vi' ? 'Lưu trữ issue' : 'Archive issue'} danger onPress={() => Alert.alert(language === 'vi' ? 'Lưu trữ issue?' : 'Archive issue?', data.identifier, [
          { text: language === 'vi' ? 'Hủy' : 'Cancel' },
          { text: language === 'vi' ? 'Lưu trữ' : 'Archive', style: 'destructive', onPress: () => archive.mutate(undefined, { onSuccess: () => router.back(), onError: mutationError }) },
        ])} />
      </ListGroup>

      <BottomSheet visible={sheet === 'status'} title={language === 'vi' ? 'Trạng thái' : 'Status'} onClose={() => setSheet(null)}>
        {(statuses.data ?? []).map((status) => <ChoiceRow key={status.id} label={status.name} active={data.status_id === status.id} onPress={() => update.mutate({ statusId: status.id }, { onSuccess: () => setSheet(null), onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'priority'} title={language === 'vi' ? 'Ưu tiên' : 'Priority'} onClose={() => setSheet(null)}>
        {priorities.map((priority) => <ChoiceRow key={priority} label={priority} active={data.priority === priority} onPress={() => update.mutate({ priority }, { onSuccess: () => setSheet(null), onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'assignee'} title="Assignee" onClose={() => setSheet(null)}>
        <ChoiceRow label={language === 'vi' ? 'Chưa giao' : 'Unassigned'} active={!data.assignee_id} onPress={() => update.mutate({ assigneeId: null }, { onSuccess: () => setSheet(null), onError: mutationError })} />
        {(members.data ?? []).map((member) => <ChoiceRow key={member.id} label={member.name} active={data.assignee_id === member.id} onPress={() => update.mutate({ assigneeId: member.id }, { onSuccess: () => setSheet(null), onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'cycle'} title="Cycle" onClose={() => setSheet(null)}>
        <ChoiceRow label={language === 'vi' ? 'Không có cycle' : 'No cycle'} active={!data.cycle_id} onPress={() => moveCycle.mutate(null, { onSuccess: () => setSheet(null), onError: mutationError })} />
        {(cycles.data ?? []).map((cycle) => <ChoiceRow key={cycle.id} label={cycle.name || `Cycle ${cycle.number}`} active={data.cycle_id === cycle.id} onPress={() => moveCycle.mutate(cycle.id, { onSuccess: () => setSheet(null), onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'milestone'} title="Milestone" onClose={() => setSheet(null)}>
        <ChoiceRow label={language === 'vi' ? 'Không có milestone' : 'No milestone'} active={!data.milestone_id} onPress={() => update.mutate({ milestoneId: null }, { onSuccess: () => setSheet(null), onError: mutationError })} />
        {(milestones.data ?? []).map((milestone) => <ChoiceRow key={milestone.id} label={milestone.title} active={data.milestone_id === milestone.id} onPress={() => update.mutate({ milestoneId: milestone.id }, { onSuccess: () => setSheet(null), onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'tags'} title="Tags" subtitle={language === 'vi' ? 'Có thể chọn nhiều' : 'Select multiple'} onClose={() => setSheet(null)}>
        {(tags.data ?? []).map((tag: any) => <ChoiceRow key={tag.id} label={tag.name} active={selectedTagIds.has(tag.id)} onPress={() => {
          const next = new Set(selectedTagIds);
          if (next.has(tag.id)) next.delete(tag.id); else next.add(tag.id);
          update.mutate({ tagIds: [...next] }, { onError: mutationError });
        }} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'due'} title={language === 'vi' ? 'Hạn hoàn thành' : 'Due date'} onClose={() => setSheet(null)} footer={<View style={styles.sheetButtons}><Button kind="secondary" title={language === 'vi' ? 'Xóa hạn' : 'Clear'} onPress={() => update.mutate({ dueDate: null }, { onSuccess: () => setSheet(null), onError: mutationError })} /><Button title={language === 'vi' ? 'Lưu' : 'Save'} disabled={!dueDate} onPress={() => update.mutate({ dueDate }, { onSuccess: () => setSheet(null), onError: mutationError })} /></View>}>
        <Field placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'schedule'} title={language === 'vi' ? 'Lịch tập trung' : 'Focus schedule'} onClose={() => setSheet(null)} footer={<Button title={language === 'vi' ? 'Xếp lịch' : 'Schedule'} disabled={!scheduleStart || Number(scheduleHours) <= 0 || schedule.isPending} onPress={() => schedule.mutate({ startsAt: new Date(scheduleStart).toISOString(), durationHours: Number(scheduleHours) }, { onSuccess: () => { setScheduleStart(''); setSheet(null); }, onError: mutationError })} />}>
        <Field placeholder="2026-09-04T14:00:00+07:00" autoCapitalize="none" value={scheduleStart} onChangeText={setScheduleStart} />
        <Field placeholder={language === 'vi' ? 'Số giờ tập trung' : 'Focus hours'} keyboardType="decimal-pad" value={scheduleHours} onChangeText={setScheduleHours} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'description'} title={language === 'vi' ? 'Sửa mô tả' : 'Edit description'} onClose={() => setSheet(null)} footer={<Button title={language === 'vi' ? 'Lưu mô tả' : 'Save description'} onPress={() => update.mutate({ description }, { onSuccess: () => setSheet(null), onError: mutationError })} />}>
        <Field multiline value={description} onChangeText={setDescription} style={{ minHeight: 180 }} />
      </BottomSheet>

      <BottomSheet visible={sheet === 'participants'} title={language === 'vi' ? 'Người tham gia' : 'Participants'} onClose={() => setSheet(null)}>
        {(participants.data ?? []).map((participant) => (
          <View key={participant.id} style={styles.manageRow}>
            <View style={styles.manageCopy}><Text style={styles.manageTitle}>{participant.name}</Text><Text style={styles.manageDetail}>{participant.role}</Text></View>
            <MotionPressable onPress={() => removeParticipant.mutate(participant.id, { onError: mutationError })}><Text style={styles.deleteText}>{language === 'vi' ? 'Xóa' : 'Remove'}</Text></MotionPressable>
          </View>
        ))}
        <Text style={styles.sheetLabel}>{language === 'vi' ? 'Vai trò khi thêm' : 'Role for new participant'}</Text>
        {participantRoles.map((role) => <ChoiceRow key={role} label={role} active={participantRole === role} onPress={() => setParticipantRole(role)} />)}
        <Text style={styles.sheetLabel}>{language === 'vi' ? 'Thêm thành viên' : 'Add member'}</Text>
        {(members.data ?? []).filter((member) => !participantUserIds.has(member.id)).map((member) => <ChoiceRow key={member.id} label={member.name} onPress={() => addParticipant.mutate({ userId: member.id, role: participantRole }, { onError: mutationError })} />)}
      </BottomSheet>

      <BottomSheet visible={sheet === 'relations'} title={language === 'vi' ? 'Liên kết issue' : 'Issue relations'} onClose={() => setSheet(null)} footer={<Button title={language === 'vi' ? 'Thêm liên kết' : 'Add relation'} disabled={!relationIdentifier.trim() || addRelation.isPending} onPress={() => addRelation.mutate({ targetIdentifier: relationIdentifier.trim(), type: relationType }, { onSuccess: () => setRelationIdentifier(''), onError: mutationError })} />}>
        {(relations.data ?? []).map((relation) => (
          <View key={relation.id} style={styles.manageRow}>
            <View style={styles.manageCopy}><Text style={styles.manageTitle}>{relation.type}</Text><Text style={styles.manageDetail}>{relation.source_issue?.identifier ?? relation.source_issue_id} → {relation.target_issue?.identifier ?? relation.target_issue_id}</Text></View>
            <MotionPressable onPress={() => deleteRelation.mutate(relation.id, { onError: mutationError })}><Text style={styles.deleteText}>{language === 'vi' ? 'Xóa' : 'Delete'}</Text></MotionPressable>
          </View>
        ))}
        <Field autoCapitalize="characters" placeholder="AIPM-42" value={relationIdentifier} onChangeText={setRelationIdentifier} />
        {relationTypes.map((type) => <ChoiceRow key={type} label={type} active={relationType === type} onPress={() => setRelationType(type)} />)}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  appBarButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surface },
  appBarTitle: { color: ui.colors.text, ...ui.typography.heading },
  hero: { gap: 8, paddingTop: 7, paddingBottom: 4 },
  identifier: { color: ui.colors.textMuted, ...ui.typography.caption, fontWeight: '600' },
  issueTitle: { color: ui.colors.text, fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.75 },
  quickMeta: { minHeight: 30, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  quickMetaItem: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickMetaText: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '600' },
  quickMetaWarning: { color: ui.colors.warning },
  quickMetaSeparator: { color: ui.colors.textMuted, fontSize: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ui.colors.success },
  textAction: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 10, backgroundColor: ui.colors.accentSoft },
  textActionLabel: { color: ui.colors.accent, ...ui.typography.caption, fontWeight: '600' },
  descriptionSurface: { paddingVertical: 4, paddingHorizontal: 1 },
  emptyCopy: { color: ui.colors.textMuted, ...ui.typography.body },
  comments: { gap: 16, paddingHorizontal: 2 },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  commentAvatarText: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '700' },
  commentBody: { flex: 1, minWidth: 0, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  commentAuthor: { flex: 1, color: ui.colors.text, ...ui.typography.bodyStrong },
  commentTime: { color: ui.colors.textMuted, ...ui.typography.caption, fontSize: 10.5 },
  commentText: { color: ui.colors.textSecondary, ...ui.typography.body, lineHeight: 21 },
  deleteText: { color: ui.colors.danger, ...ui.typography.caption, fontWeight: '600' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 4 },
  commentField: { flex: 1, minHeight: 48, maxHeight: 120 },
  sendButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.accentStrong },
  sendDisabled: { opacity: 0.4 },
  sheetButtons: { flexDirection: 'row', gap: 8 },
  manageRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.colors.border },
  manageCopy: { flex: 1, minWidth: 0 },
  manageTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
  manageDetail: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  sheetLabel: { color: ui.colors.textMuted, ...ui.typography.eyebrow, marginTop: 8, marginBottom: 2 },
});
