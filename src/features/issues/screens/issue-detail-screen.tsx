import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Button, Card, Field, Label, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
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

export default function IssueDetailScreen() {
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const { user } = useAuth();
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
  } = useIssueDetailData(identifier);

  const update = useUpdateIssue(identifier, issue.data?.version);
  const moveCycle = useMoveIssueCycle(projectId, issue.data);
  const addComment = useAddIssueComment(issue.data?.id);
  const deleteComment = useDeleteIssueComment(issue.data?.id);
  const addParticipant = useAddIssueParticipant(identifier);
  const removeParticipant = useRemoveIssueParticipant(identifier);
  const addRelation = useCreateIssueRelation(issue.data?.id);
  const deleteRelation = useDeleteIssueRelation(issue.data?.id);
  const schedule = useScheduleIssue(identifier);
  const archive = useArchiveIssue(identifier);

  const [comment, setComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
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

  if (issue.isLoading) return <LoadingScreen />;
  if (!issue.data) return <Screen title={identifier ?? 'Issue'}><Muted>Không tìm thấy issue.</Muted></Screen>;

  const data = issue.data;
  const selectedTagIds = new Set((data.tags ?? []).map((tag: any) => tag.id ?? tag.tag?.id).filter(Boolean));
  const participantUserIds = new Set((participants.data ?? []).map((participant) => participant.userId));
  const mutationError = (error: unknown) => presentError('Không thể cập nhật', error);

  return (
    <Screen
      title={data.identifier}
      subtitle={statusName}
      refreshing={issue.isRefetching}
      onRefresh={() => void refresh()}
    >
      <Card>
        <Text style={styles.issueTitle}>{data.title}</Text>
        <View style={styles.row}><Pill text={data.priority} /><Pill text={statusName} /></View>
      </Card>

      <SectionTitle>Trạng thái</SectionTitle>
      <View style={styles.wrap}>
        {(statuses.data ?? []).map((status) => (
          <Choice
            key={status.id}
            active={data.status_id === status.id}
            text={status.name}
            onPress={() => update.mutate({ statusId: status.id }, { onError: mutationError })}
          />
        ))}
      </View>

      <SectionTitle>Ưu tiên</SectionTitle>
      <View style={styles.wrap}>
        {priorities.map((priority) => (
          <Choice key={priority} active={data.priority === priority} text={priority} onPress={() => update.mutate({ priority }, { onError: mutationError })} />
        ))}
      </View>

      <SectionTitle>Assignee</SectionTitle>
      <View style={styles.wrap}>
        <Choice text="Unassigned" active={!data.assignee_id} onPress={() => update.mutate({ assigneeId: null }, { onError: mutationError })} />
        {(members.data ?? []).map((member) => (
          <Choice key={member.id} active={data.assignee_id === member.id} text={member.name} onPress={() => update.mutate({ assigneeId: member.id }, { onError: mutationError })} />
        ))}
      </View>

      <SectionTitle>Cycle</SectionTitle>
      <View style={styles.wrap}>
        <Choice text="No cycle" active={!data.cycle_id} onPress={() => moveCycle.mutate(null, { onError: mutationError })} />
        {(cycles.data ?? []).map((cycle) => (
          <Choice key={cycle.id} active={data.cycle_id === cycle.id} text={cycle.name || `Cycle ${cycle.number}`} onPress={() => moveCycle.mutate(cycle.id, { onError: mutationError })} />
        ))}
      </View>

      <SectionTitle>Milestone</SectionTitle>
      <View style={styles.wrap}>
        <Choice text="No milestone" active={!data.milestone_id} onPress={() => update.mutate({ milestoneId: null }, { onError: mutationError })} />
        {(milestones.data ?? []).map((milestone) => (
          <Choice key={milestone.id} active={data.milestone_id === milestone.id} text={milestone.title} onPress={() => update.mutate({ milestoneId: milestone.id }, { onError: mutationError })} />
        ))}
      </View>

      <SectionTitle>Tags</SectionTitle>
      <View style={styles.wrap}>
        {(tags.data ?? []).map((tag: any) => (
          <Choice
            key={tag.id}
            active={selectedTagIds.has(tag.id)}
            text={tag.name}
            onPress={() => {
              const next = new Set(selectedTagIds);
              if (next.has(tag.id)) next.delete(tag.id); else next.add(tag.id);
              update.mutate({ tagIds: [...next] }, { onError: mutationError });
            }}
          />
        ))}
      </View>

      <SectionTitle>Due date</SectionTitle>
      <Card>
        <Muted>Hiện tại: {data.due_date ? new Date(data.due_date).toLocaleDateString('vi-VN') : 'Chưa đặt'}</Muted>
        <Field placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />
        <View style={styles.row}>
          <Button title="Lưu hạn" disabled={!dueDate} onPress={() => update.mutate({ dueDate }, { onError: mutationError })} />
          <Button kind="secondary" title="Xóa hạn" onPress={() => update.mutate({ dueDate: null }, { onError: mutationError })} />
        </View>
      </Card>

      <SectionTitle>Schedule / Focus</SectionTitle>
      <Card>
        <Muted>{data.scheduled_start ? `Scheduled: ${new Date(data.scheduled_start).toLocaleString('vi-VN')} · ${Number(data.focus_hours ?? 0)}h` : 'Chưa xếp lịch'}</Muted>
        <Field placeholder="2026-09-04T14:00:00+07:00" autoCapitalize="none" value={scheduleStart} onChangeText={setScheduleStart} />
        <Field placeholder="Giờ focus" keyboardType="decimal-pad" value={scheduleHours} onChangeText={setScheduleHours} />
        <Button
          title="Xếp lịch"
          disabled={!scheduleStart || Number(scheduleHours) <= 0 || schedule.isPending}
          onPress={() => schedule.mutate(
            { startsAt: new Date(scheduleStart).toISOString(), durationHours: Number(scheduleHours) },
            {
              onSuccess: () => setScheduleStart(''),
              onError: mutationError,
            },
          )}
        />
      </Card>

      <View style={styles.headerRow}>
        <SectionTitle>Mô tả</SectionTitle>
        <Button kind="secondary" title={editingDescription ? 'Hủy' : 'Sửa'} onPress={() => {
          if (!editingDescription) setDescription(data.description ?? '');
          setEditingDescription((value) => !value);
        }} />
      </View>
      {editingDescription ? (
        <Card>
          <Field multiline value={description} onChangeText={setDescription} />
          <Button title="Lưu" onPress={() => update.mutate(
            { description },
            { onSuccess: () => setEditingDescription(false), onError: mutationError },
          )} />
        </Card>
      ) : (
        <Card>
          {data.description ? (
            <Markdown style={{ body: { color: '#d9e0e7' }, heading1: { color: '#fff' }, heading2: { color: '#fff' }, code_inline: { color: '#cfd9e3', backgroundColor: '#1b2632' } }}>
              {data.description}
            </Markdown>
          ) : <Muted>Chưa có mô tả.</Muted>}
        </Card>
      )}

      <SectionTitle>Participants</SectionTitle>
      {(participants.data ?? []).map((participant) => (
        <Card key={participant.id}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.value}>{participant.name}</Text>
              <Muted>{participant.email} · {participant.role}</Muted>
            </View>
            <Button kind="danger" title="Xóa" onPress={() => removeParticipant.mutate(participant.id, { onError: mutationError })} />
          </View>
        </Card>
      ))}
      <Card>
        <Label>Thêm participant ({participantRole})</Label>
        <View style={styles.wrap}>
          {participantRoles.map((role) => <Choice key={role} text={role} active={participantRole === role} onPress={() => setParticipantRole(role)} />)}
        </View>
        <View style={styles.wrap}>
          {(members.data ?? []).filter((member) => !participantUserIds.has(member.id)).map((member) => (
            <Choice
              key={member.id}
              text={member.name}
              onPress={() => addParticipant.mutate({ userId: member.id, role: participantRole }, { onError: mutationError })}
            />
          ))}
        </View>
      </Card>

      <SectionTitle>Relations</SectionTitle>
      {(relations.data ?? []).map((relation) => (
        <Card key={relation.id}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{relation.type}</Text>
              <Muted>{relation.source_issue?.identifier ?? relation.source_issue_id} → {relation.target_issue?.identifier ?? relation.target_issue_id}</Muted>
            </View>
            <Button kind="danger" title="Xóa" onPress={() => deleteRelation.mutate(relation.id, { onError: mutationError })} />
          </View>
        </Card>
      ))}
      <Card>
        <Field autoCapitalize="characters" placeholder="Target issue, VD AIPM-42" value={relationIdentifier} onChangeText={setRelationIdentifier} />
        <View style={styles.wrap}>
          {relationTypes.map((type) => <Choice key={type} active={relationType === type} text={type} onPress={() => setRelationType(type)} />)}
        </View>
        <Button
          title="Thêm relation"
          disabled={!relationIdentifier.trim() || addRelation.isPending}
          onPress={() => addRelation.mutate(
            { targetIdentifier: relationIdentifier.trim(), type: relationType },
            {
              onSuccess: () => setRelationIdentifier(''),
              onError: mutationError,
            },
          )}
        />
      </Card>

      <SectionTitle>Comments</SectionTitle>
      {(comments.data ?? []).map((item) => (
        <Card key={item.id}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{item.author?.name ?? item.author_id}</Text>
              <Muted>{new Date(item.created_at).toLocaleString('vi-VN')}</Muted>
            </View>
            {item.author_id === user?.id ? <Button kind="danger" title="Xóa" onPress={() => deleteComment.mutate(item.id, { onError: mutationError })} /> : null}
          </View>
          <Text style={styles.comment}>{item.body}</Text>
        </Card>
      ))}
      <Card>
        <Field multiline placeholder="Viết bình luận, dùng @email để mention..." value={comment} onChangeText={setComment} />
        <Button
          title={addComment.isPending ? 'Đang gửi...' : 'Gửi bình luận'}
          disabled={!comment.trim() || addComment.isPending}
          onPress={() => addComment.mutate(comment.trim(), { onSuccess: () => setComment(''), onError: mutationError })}
        />
      </Card>

      <SectionTitle>Danger zone</SectionTitle>
      <Button
        kind="danger"
        title="Archive issue"
        onPress={() => Alert.alert('Archive issue?', data.identifier, [
          { text: 'Hủy' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: () => archive.mutate(undefined, {
              onSuccess: () => router.back(),
              onError: mutationError,
            }),
          },
        ])}
      />
    </Screen>
  );
}

function Choice({ text, active = false, onPress }: { text: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={styles.choiceText}>{text}</Text></Pressable>;
}

const styles = StyleSheet.create({
  issueTitle: { color: '#f5f7fa', fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#17212b' },
  choiceActive: { backgroundColor: '#2388ff' },
  choiceText: { color: '#edf2f7', fontWeight: '800', fontSize: 12 },
  value: { color: '#eef2f6', fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  comment: { color: '#d4dde5', lineHeight: 20 },
});
