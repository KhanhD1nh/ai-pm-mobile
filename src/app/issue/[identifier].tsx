import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Button, Card, Field, Label, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { LoadingScreen, Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { issuesApi, projectsApi } from '@/services/api';
import type { ParticipantRole, Priority } from '@/types';

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const participantRoles: ParticipantRole[] = ['ASSIGNEE', 'REVIEWER', 'NEXT_REVIEWER', 'OBSERVER'];
const relationTypes = ['BLOCKS', 'RELATES_TO', 'DUPLICATES'] as const;

export default function IssueDetailScreen() {
  const { identifier } = useLocalSearchParams<{ identifier: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const issue = useQuery({ queryKey: ['issue', identifier], queryFn: () => issuesApi.get(identifier!), enabled: !!identifier });
  const projectId = issue.data?.project_id;
  const statuses = useQuery({ queryKey: ['statuses', projectId], queryFn: () => projectsApi.statuses(projectId!), enabled: !!projectId });
  const members = useQuery({ queryKey: ['project-members', projectId], queryFn: () => projectsApi.members(projectId!), enabled: !!projectId });
  const cycles = useQuery({ queryKey: ['cycles', projectId], queryFn: () => projectsApi.cycles(projectId!), enabled: !!projectId });
  const milestones = useQuery({ queryKey: ['milestones', projectId], queryFn: () => projectsApi.milestones(projectId!), enabled: !!projectId });
  const tags = useQuery({ queryKey: ['tags', projectId], queryFn: () => projectsApi.tags(projectId!), enabled: !!projectId });
  const comments = useQuery({ queryKey: ['comments', issue.data?.id], queryFn: () => issuesApi.comments(issue.data!.id), enabled: !!issue.data?.id });
  const participants = useQuery({ queryKey: ['participants', identifier], queryFn: () => issuesApi.participants(identifier!), enabled: !!identifier });
  const relations = useQuery({ queryKey: ['relations', issue.data?.id], queryFn: () => issuesApi.relations(issue.data!.id), enabled: !!issue.data?.id });

  const [comment, setComment] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleHours, setScheduleHours] = useState('2');
  const [relationIdentifier, setRelationIdentifier] = useState('');
  const [relationType, setRelationType] = useState<(typeof relationTypes)[number]>('RELATES_TO');
  const [participantRole, setParticipantRole] = useState<ParticipantRole>('OBSERVER');

  const invalidateIssue = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['issue', identifier] }),
      qc.invalidateQueries({ queryKey: ['issues'] }),
      qc.invalidateQueries({ queryKey: ['my-work'] }),
      qc.invalidateQueries({ queryKey: ['project-report'] }),
    ]);
  };

  const update = useMutation({
    mutationFn: (data: Record<string, unknown>) => issuesApi.update(identifier!, { ...data, expectedVersion: issue.data?.version }),
    onSuccess: invalidateIssue,
    onError: showError,
  });
  const moveCycle = useMutation({
    mutationFn: async (cycleId: string | null) => {
      if (!projectId || !issue.data) return;
      if (issue.data.cycle_id && issue.data.cycle_id !== cycleId) await projectsApi.removeIssueFromCycle(projectId, issue.data.cycle_id, issue.data.id);
      if (cycleId) await projectsApi.addIssueToCycle(projectId, cycleId, issue.data.id);
    },
    onSuccess: invalidateIssue,
    onError: showError,
  });
  const addComment = useMutation({
    mutationFn: () => issuesApi.addComment(issue.data!.id, comment.trim()),
    onSuccess: async () => { setComment(''); await qc.invalidateQueries({ queryKey: ['comments', issue.data?.id] }); },
    onError: showError,
  });
  const deleteComment = useMutation({
    mutationFn: (commentId: string) => issuesApi.deleteComment(issue.data!.id, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', issue.data?.id] }),
    onError: showError,
  });
  const addParticipant = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => issuesApi.addParticipant(identifier!, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', identifier] }),
    onError: showError,
  });
  const removeParticipant = useMutation({
    mutationFn: (id: string) => issuesApi.removeParticipant(identifier!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['participants', identifier] }),
    onError: showError,
  });
  const addRelation = useMutation({
    mutationFn: async () => {
      const target = await issuesApi.get(relationIdentifier.trim());
      return issuesApi.createRelation(issue.data!.id, target.id, relationType);
    },
    onSuccess: async () => { setRelationIdentifier(''); await qc.invalidateQueries({ queryKey: ['relations', issue.data?.id] }); },
    onError: showError,
  });
  const deleteRelation = useMutation({
    mutationFn: issuesApi.deleteRelation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relations', issue.data?.id] }),
    onError: showError,
  });
  const schedule = useMutation({
    mutationFn: () => issuesApi.schedule(identifier!, new Date(scheduleStart).toISOString(), Number(scheduleHours)),
    onSuccess: async () => { setScheduleStart(''); await invalidateIssue(); },
    onError: showError,
  });

  const statusName = useMemo(() => issue.data?.status?.name ?? statuses.data?.find((s) => s.id === issue.data?.status_id)?.name ?? '—', [issue.data, statuses.data]);
  if (issue.isLoading) return <LoadingScreen />;
  if (!issue.data) return <Screen title={identifier ?? 'Issue'}><Muted>Không tìm thấy issue.</Muted></Screen>;
  const data = issue.data;
  const selectedTagIds = new Set((data.tags ?? []).map((t: any) => t.id ?? t.tag?.id).filter(Boolean));
  const participantUserIds = new Set((participants.data ?? []).map((p) => p.userId));

  return <Screen title={data.identifier} subtitle={statusName} refreshing={issue.isRefetching} onRefresh={() => { void issue.refetch(); void comments.refetch(); void participants.refetch(); void relations.refetch(); }}>
    <Card><Text style={styles.issueTitle}>{data.title}</Text><View style={styles.row}><Pill text={data.priority} /><Pill text={statusName} /></View></Card>

    <SectionTitle>Trạng thái</SectionTitle>
    <View style={styles.wrap}>{(statuses.data ?? []).map((s) => <Choice key={s.id} active={data.status_id === s.id} text={s.name} onPress={() => update.mutate({ statusId: s.id })} />)}</View>

    <SectionTitle>Ưu tiên</SectionTitle>
    <View style={styles.wrap}>{priorities.map((p) => <Choice key={p} active={data.priority === p} text={p} onPress={() => update.mutate({ priority: p })} />)}</View>

    <SectionTitle>Assignee</SectionTitle>
    <View style={styles.wrap}><Choice text="Unassigned" active={!data.assignee_id} onPress={() => update.mutate({ assigneeId: null })} />{(members.data ?? []).map((m) => <Choice key={m.id} active={data.assignee_id === m.id} text={m.name} onPress={() => update.mutate({ assigneeId: m.id })} />)}</View>

    <SectionTitle>Cycle</SectionTitle>
    <View style={styles.wrap}><Choice text="No cycle" active={!data.cycle_id} onPress={() => moveCycle.mutate(null)} />{(cycles.data ?? []).map((c) => <Choice key={c.id} active={data.cycle_id === c.id} text={c.name || `Cycle ${c.number}`} onPress={() => moveCycle.mutate(c.id)} />)}</View>

    <SectionTitle>Milestone</SectionTitle>
    <View style={styles.wrap}><Choice text="No milestone" active={!data.milestone_id} onPress={() => update.mutate({ milestoneId: null })} />{(milestones.data ?? []).map((m) => <Choice key={m.id} active={data.milestone_id === m.id} text={m.title} onPress={() => update.mutate({ milestoneId: m.id })} />)}</View>

    <SectionTitle>Tags</SectionTitle>
    <View style={styles.wrap}>{(tags.data ?? []).map((tag: any) => <Choice key={tag.id} active={selectedTagIds.has(tag.id)} text={tag.name} onPress={() => { const next = new Set(selectedTagIds); if (next.has(tag.id)) next.delete(tag.id); else next.add(tag.id); update.mutate({ tagIds: [...next] }); }} />)}</View>

    <SectionTitle>Due date</SectionTitle>
    <Card><Muted>Hiện tại: {data.due_date ? new Date(data.due_date).toLocaleDateString('vi-VN') : 'Chưa đặt'}</Muted><Field placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} /><View style={styles.row}><Button title="Lưu hạn" disabled={!dueDate} onPress={() => update.mutate({ dueDate })} /><Button kind="secondary" title="Xóa hạn" onPress={() => update.mutate({ dueDate: null })} /></View></Card>

    <SectionTitle>Schedule / Focus</SectionTitle>
    <Card><Muted>{data.scheduled_start ? `Scheduled: ${new Date(data.scheduled_start).toLocaleString('vi-VN')} · ${Number(data.focus_hours ?? 0)}h` : 'Chưa xếp lịch'}</Muted><Field placeholder="2026-09-04T14:00:00+07:00" autoCapitalize="none" value={scheduleStart} onChangeText={setScheduleStart} /><Field placeholder="Giờ focus" keyboardType="decimal-pad" value={scheduleHours} onChangeText={setScheduleHours} /><Button title="Xếp lịch" disabled={!scheduleStart || Number(scheduleHours) <= 0 || schedule.isPending} onPress={() => schedule.mutate()} /></Card>

    <View style={styles.headerRow}><SectionTitle>Mô tả</SectionTitle><Button kind="secondary" title={editingDescription ? 'Hủy' : 'Sửa'} onPress={() => { if (!editingDescription) setDescription(data.description ?? ''); setEditingDescription((v) => !v); }} /></View>
    {editingDescription ? <Card><Field multiline value={description} onChangeText={setDescription} /><Button title="Lưu" onPress={() => { update.mutate({ description }); setEditingDescription(false); }} /></Card> : <Card>{data.description ? <Markdown style={{ body: { color: '#d9e0e7' }, heading1: { color: '#fff' }, heading2: { color: '#fff' }, code_inline: { color: '#cfd9e3', backgroundColor: '#1b2632' } }}>{data.description}</Markdown> : <Muted>Chưa có mô tả.</Muted>}</Card>}

    <SectionTitle>Participants</SectionTitle>
    {(participants.data ?? []).map((p) => <Card key={p.id}><View style={styles.headerRow}><View><Text style={styles.value}>{p.name}</Text><Muted>{p.email} · {p.role}</Muted></View><Button kind="danger" title="Xóa" onPress={() => removeParticipant.mutate(p.id)} /></View></Card>)}
    <Card><Label>Thêm participant ({participantRole})</Label><View style={styles.wrap}>{participantRoles.map((r) => <Choice key={r} text={r} active={participantRole === r} onPress={() => setParticipantRole(r)} />)}</View><View style={styles.wrap}>{(members.data ?? []).filter((m) => !participantUserIds.has(m.id)).map((m) => <Choice key={m.id} text={m.name} onPress={() => addParticipant.mutate({ userId: m.id, role: participantRole })} />)}</View></Card>

    <SectionTitle>Relations</SectionTitle>
    {(relations.data ?? []).map((r) => <Card key={r.id}><View style={styles.headerRow}><View style={{ flex: 1 }}><Text style={styles.value}>{r.type}</Text><Muted>{r.source_issue?.identifier ?? r.source_issue_id} → {r.target_issue?.identifier ?? r.target_issue_id}</Muted></View><Button kind="danger" title="Xóa" onPress={() => deleteRelation.mutate(r.id)} /></View></Card>)}
    <Card><Field autoCapitalize="characters" placeholder="Target issue, VD AIPM-42" value={relationIdentifier} onChangeText={setRelationIdentifier} /><View style={styles.wrap}>{relationTypes.map((type) => <Choice key={type} active={relationType === type} text={type} onPress={() => setRelationType(type)} />)}</View><Button title="Thêm relation" disabled={!relationIdentifier.trim() || addRelation.isPending} onPress={() => addRelation.mutate()} /></Card>

    <SectionTitle>Comments</SectionTitle>
    {(comments.data ?? []).map((c) => <Card key={c.id}><View style={styles.headerRow}><View style={{ flex: 1 }}><Text style={styles.value}>{c.author?.name ?? c.author_id}</Text><Muted>{new Date(c.created_at).toLocaleString('vi-VN')}</Muted></View>{c.author_id === user?.id ? <Button kind="danger" title="Xóa" onPress={() => deleteComment.mutate(c.id)} /> : null}</View><Text style={styles.comment}>{c.body}</Text></Card>)}
    <Card><Field multiline placeholder="Viết bình luận, dùng @email để mention..." value={comment} onChangeText={setComment} /><Button title={addComment.isPending ? 'Đang gửi...' : 'Gửi bình luận'} disabled={!comment.trim() || addComment.isPending} onPress={() => addComment.mutate()} /></Card>

    <SectionTitle>Danger zone</SectionTitle>
    <Button kind="danger" title="Archive issue" onPress={() => Alert.alert('Archive issue?', data.identifier, [{ text: 'Hủy' }, { text: 'Archive', style: 'destructive', onPress: () => void issuesApi.archive(data.identifier).then(() => { qc.invalidateQueries({ queryKey: ['issues'] }); router.back(); }).catch(showError) }])} />
  </Screen>;
}

function Choice({ text, active = false, onPress }: { text: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={styles.choiceText}>{text}</Text></Pressable>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ issueTitle: { color: '#f5f7fa', fontSize: 20, fontWeight: '900' }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#17212b' }, choiceActive: { backgroundColor: '#2388ff' }, choiceText: { color: '#edf2f7', fontWeight: '800', fontSize: 12 }, value: { color: '#eef2f6', fontWeight: '800' }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, comment: { color: '#d4dde5', lineHeight: 20 } });
