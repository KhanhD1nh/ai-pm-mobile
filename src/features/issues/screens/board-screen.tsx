import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { EmptyState, LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import type { Priority } from '@/shared/contracts';
import { useBoardData } from '../queries/use-board-data';
import { useCreateIssue, useQuickMoveIssue } from '../mutations/use-board-mutations';

const priorities: (Priority | 'ALL')[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function BoardScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, statuses, members, cycles, issues, refresh } = useBoardData(projectId);
  const create = useCreateIssue(projectId);
  const quickMove = useQuickMoveIssue(projectId);

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

  const orderedStatuses = useMemo(
    () => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position),
    [statuses.data],
  );

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

  const submitIssue = () => create.mutate(
    {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      statusId: orderedStatuses[0]?.id,
      assigneeId: createAssignee || undefined,
    },
    {
      onSuccess: () => {
        setOpen(false);
        setTitle('');
        setDescription('');
        setCreateAssignee('');
      },
      onError: (error) => presentError('Không thể cập nhật Board', error),
    },
  );

  if (project.isLoading) return <LoadingScreen />;

  return (
    <Screen
      title={`Board · ${project.data?.key ?? ''}`}
      subtitle={`${filtered.length} / ${issues.data?.length ?? 0} issues`}
      right={<Button title="+ Issue" onPress={() => setOpen(true)} />}
      refreshing={issues.isRefetching}
      onRefresh={() => void refresh()}
    >
      <Field placeholder="Tìm issue..." value={search} onChangeText={setSearch} />
      <View style={styles.filters}>
        <Choice active={statusId === 'ALL'} text="All" onPress={() => setStatusId('ALL')} />
        {orderedStatuses.map((status) => (
          <Choice key={status.id} active={statusId === status.id} text={status.name} onPress={() => setStatusId(status.id)} />
        ))}
      </View>
      <Button kind="secondary" title={showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'} onPress={() => setShowFilters((value) => !value)} />

      {showFilters ? (
        <Card>
          <SectionTitle>Priority</SectionTitle>
          <View style={styles.filters}>
            {priorities.map((item) => <Choice key={item} active={priorityFilter === item} text={item} onPress={() => setPriorityFilter(item)} />)}
          </View>
          <SectionTitle>Assignee</SectionTitle>
          <View style={styles.filters}>
            <Choice active={assigneeFilter === 'ALL'} text="ALL" onPress={() => setAssigneeFilter('ALL')} />
            <Choice active={assigneeFilter === 'UNASSIGNED'} text="UNASSIGNED" onPress={() => setAssigneeFilter('UNASSIGNED')} />
            {(members.data ?? []).map((member) => <Choice key={member.id} active={assigneeFilter === member.id} text={member.name} onPress={() => setAssigneeFilter(member.id)} />)}
          </View>
          <SectionTitle>Cycle</SectionTitle>
          <View style={styles.filters}>
            <Choice active={cycleFilter === 'ALL'} text="ALL" onPress={() => setCycleFilter('ALL')} />
            <Choice active={cycleFilter === 'NONE'} text="NO CYCLE" onPress={() => setCycleFilter('NONE')} />
            {(cycles.data ?? []).map((cycle) => <Choice key={cycle.id} active={cycleFilter === cycle.id} text={cycle.name || `Cycle ${cycle.number}`} onPress={() => setCycleFilter(cycle.id)} />)}
          </View>
        </Card>
      ) : null}

      {filtered.length === 0 ? <EmptyState title="Không có issue phù hợp" /> : filtered.map((issue) => {
        const index = orderedStatuses.findIndex((status) => status.id === issue.status_id);
        const next = index >= 0 ? orderedStatuses[index + 1] : undefined;
        return (
          <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}>
            <Card>
              <View style={styles.row}><Pill text={issue.identifier} /><Pill text={issue.priority} /></View>
              <Text style={styles.title}>{issue.title}</Text>
              <Muted>{issue.status?.name ?? orderedStatuses.find((status) => status.id === issue.status_id)?.name ?? '—'}{issue.assignee?.name ? ` · ${issue.assignee.name}` : ''}</Muted>
              {next ? (
                <Button
                  kind="secondary"
                  title={`→ ${next.name}`}
                  disabled={quickMove.isPending}
                  onPress={() => quickMove.mutate(
                    { identifier: issue.identifier, version: issue.version, statusId: next.id },
                    { onError: (error) => presentError('Không thể cập nhật Board', error) },
                  )}
                />
              ) : null}
            </Card>
          </Pressable>
        );
      })}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo Issue</Text>
            <Field placeholder="Tiêu đề" value={title} onChangeText={setTitle} />
            <Field placeholder="Mô tả" multiline value={description} onChangeText={setDescription} />
            <SectionTitle>Priority</SectionTitle>
            <View style={styles.filters}>
              {priorities.filter((item) => item !== 'ALL').map((item) => <Choice key={item} active={priority === item} text={item} onPress={() => setPriority(item as Priority)} />)}
            </View>
            <SectionTitle>Assignee</SectionTitle>
            <View style={styles.filters}>
              <Choice active={!createAssignee} text="Unassigned" onPress={() => setCreateAssignee('')} />
              {(members.data ?? []).map((member) => <Choice key={member.id} active={createAssignee === member.id} text={member.name} onPress={() => setCreateAssignee(member.id)} />)}
            </View>
            <Button title={create.isPending ? 'Đang tạo...' : 'Tạo Issue'} disabled={!title.trim() || create.isPending} onPress={submitIssue} />
            <Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Choice({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filter, active && styles.active]}><Text style={styles.filterText}>{text}</Text></Pressable>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' },
  active: { backgroundColor: '#2388ff' },
  filterText: { color: '#e5ebf1', fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#f5f7fa', fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
});
