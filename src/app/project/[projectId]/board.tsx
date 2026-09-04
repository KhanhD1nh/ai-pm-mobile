import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { EmptyState, LoadingScreen, Screen } from '@/components/ui/screen';
import { issuesApi, projectsApi } from '@/services/api';
import type { Priority } from '@/types';

const priorities: Array<Priority | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function BoardScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const statuses = useQuery({ queryKey: ['statuses', projectId], queryFn: () => projectsApi.statuses(projectId!), enabled: !!projectId });
  const members = useQuery({ queryKey: ['project-members', projectId], queryFn: () => projectsApi.members(projectId!), enabled: !!projectId });
  const cycles = useQuery({ queryKey: ['cycles', projectId], queryFn: () => projectsApi.cycles(projectId!), enabled: !!projectId });
  const issues = useQuery({ queryKey: ['issues', projectId], queryFn: () => issuesApi.list({ projectId, limit: 200 }), enabled: !!projectId });

  const [statusId, setStatusId] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [createAssignee, setCreateAssignee] = useState('');

  const orderedStatuses = useMemo(() => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position), [statuses.data]);
  const create = useMutation({
    mutationFn: () => issuesApi.create({ projectId, title: title.trim(), description: description.trim() || undefined, priority, statusId: orderedStatuses[0]?.id, assigneeId: createAssignee || undefined }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['issues', projectId] }); setOpen(false); setTitle(''); setDescription(''); setCreateAssignee(''); },
    onError: showError,
  });
  const quickMove = useMutation({
    mutationFn: ({ identifier, version, statusId }: { identifier: string; version: number; statusId: string }) => issuesApi.update(identifier, { statusId, expectedVersion: version }),
    onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['issues', projectId] }), qc.invalidateQueries({ queryKey: ['project-report'] })]); },
    onError: showError,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (issues.data ?? []).filter((issue) => {
      if (statusId !== 'ALL' && issue.status_id !== statusId) return false;
      if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) return false;
      if (assigneeFilter === 'UNASSIGNED' && issue.assignee_id) return false;
      if (assigneeFilter !== 'ALL' && assigneeFilter !== 'UNASSIGNED' && issue.assignee_id !== assigneeFilter) return false;
      if (cycleFilter === 'NONE' && issue.cycle_id) return false;
      if (cycleFilter !== 'ALL' && cycleFilter !== 'NONE' && issue.cycle_id !== cycleFilter) return false;
      if (term && !issue.title.toLowerCase().includes(term) && !issue.identifier.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [issues.data, statusId, priorityFilter, assigneeFilter, cycleFilter, search]);

  if (project.isLoading) return <LoadingScreen />;

  return <Screen title={`Board · ${project.data?.key ?? ''}`} subtitle={`${filtered.length} / ${issues.data?.length ?? 0} issues`} right={<Button title="+ Issue" onPress={() => setOpen(true)} />} refreshing={issues.isRefetching} onRefresh={() => { void issues.refetch(); void statuses.refetch(); void members.refetch(); void cycles.refetch(); }}>
    <Field placeholder="Tìm issue..." value={search} onChangeText={setSearch} />
    <View style={styles.filters}><Choice active={statusId === 'ALL'} text="All" onPress={() => setStatusId('ALL')} />{orderedStatuses.map((s) => <Choice key={s.id} active={statusId === s.id} text={s.name} onPress={() => setStatusId(s.id)} />)}</View>
    <Button kind="secondary" title={showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'} onPress={() => setShowFilters((v) => !v)} />
    {showFilters ? <Card><SectionTitle>Priority</SectionTitle><View style={styles.filters}>{priorities.map((p) => <Choice key={p} active={priorityFilter === p} text={p} onPress={() => setPriorityFilter(p)} />)}</View><SectionTitle>Assignee</SectionTitle><View style={styles.filters}><Choice active={assigneeFilter === 'ALL'} text="ALL" onPress={() => setAssigneeFilter('ALL')} /><Choice active={assigneeFilter === 'UNASSIGNED'} text="UNASSIGNED" onPress={() => setAssigneeFilter('UNASSIGNED')} />{(members.data ?? []).map((m) => <Choice key={m.id} active={assigneeFilter === m.id} text={m.name} onPress={() => setAssigneeFilter(m.id)} />)}</View><SectionTitle>Cycle</SectionTitle><View style={styles.filters}><Choice active={cycleFilter === 'ALL'} text="ALL" onPress={() => setCycleFilter('ALL')} /><Choice active={cycleFilter === 'NONE'} text="NO CYCLE" onPress={() => setCycleFilter('NONE')} />{(cycles.data ?? []).map((c) => <Choice key={c.id} active={cycleFilter === c.id} text={c.name || `Cycle ${c.number}`} onPress={() => setCycleFilter(c.id)} />)}</View></Card> : null}

    {filtered.length === 0 ? <EmptyState title="Không có issue phù hợp" /> : filtered.map((issue) => {
      const index = orderedStatuses.findIndex((s) => s.id === issue.status_id);
      const next = index >= 0 ? orderedStatuses[index + 1] : undefined;
      return <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}><Card><View style={styles.row}><Pill text={issue.identifier} /><Pill text={issue.priority} /></View><Text style={styles.title}>{issue.title}</Text><Muted>{issue.status?.name ?? orderedStatuses.find((s) => s.id === issue.status_id)?.name ?? '—'}{issue.assignee?.name ? ` · ${issue.assignee.name}` : ''}</Muted>{next ? <Button kind="secondary" title={`→ ${next.name}`} disabled={quickMove.isPending} onPress={() => quickMove.mutate({ identifier: issue.identifier, version: issue.version, statusId: next.id })} /> : null}</Card></Pressable>;
    })}

    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>Tạo Issue</Text><Field placeholder="Tiêu đề" value={title} onChangeText={setTitle} /><Field placeholder="Mô tả" multiline value={description} onChangeText={setDescription} /><SectionTitle>Priority</SectionTitle><View style={styles.filters}>{priorities.filter((p) => p !== 'ALL').map((p) => <Choice key={p} active={priority === p} text={p} onPress={() => setPriority(p as Priority)} />)}</View><SectionTitle>Assignee</SectionTitle><View style={styles.filters}><Choice active={!createAssignee} text="Unassigned" onPress={() => setCreateAssignee('')} />{(members.data ?? []).map((m) => <Choice key={m.id} active={createAssignee === m.id} text={m.name} onPress={() => setCreateAssignee(m.id)} />)}</View><Button title={create.isPending ? 'Đang tạo...' : 'Tạo Issue'} disabled={!title.trim() || create.isPending} onPress={() => create.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} /></View></View></Modal>
  </Screen>;
}

function Choice({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.filter, active && styles.active]}><Text style={styles.filterText}>{text}</Text></Pressable>; }
function showError(error: unknown) { Alert.alert('Không thể cập nhật Board', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' }, active: { backgroundColor: '#2388ff' }, filterText: { color: '#e5ebf1', fontSize: 12, fontWeight: '800' }, row: { flexDirection: 'row', justifyContent: 'space-between' }, title: { color: '#f5f7fa', fontWeight: '800' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }, sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' } });
