import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { projectsApi } from '@/services/api';
import type { StatusCategory } from '@/types';

const categories: StatusCategory[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED', 'REJECTED'];

export default function WorkflowScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const statuses = useQuery({ queryKey: ['statuses', projectId], queryFn: () => projectsApi.statuses(projectId!), enabled: !!projectId });
  const ordered = [...(statuses.data ?? [])].sort((a, b) => a.position - b.position);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StatusCategory>('TODO');
  const create = useMutation({ mutationFn: () => projectsApi.createStatus(projectId!, { name: name.trim(), category, position: ordered.length + 1 }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['statuses', projectId] }); setOpen(false); setName(''); }, onError: showError });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => projectsApi.updateStatus(projectId!, id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses', projectId] }), onError: showError });
  const remove = useMutation({ mutationFn: (id: string) => projectsApi.deleteStatus(projectId!, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses', projectId] }), onError: showError });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const a = ordered[index]!; const b = ordered[target]!;
    update.mutate({ id: a.id, data: { position: b.position } });
    update.mutate({ id: b.id, data: { position: a.position } });
  };
  return <Screen title={`Workflow · ${project.data?.key ?? ''}`} subtitle="Quản lý thứ tự Board" right={<Button title="+ Status" onPress={() => setOpen(true)} />}>
    {ordered.map((s, index) => <Card key={s.id}><View style={styles.row}><Pill text={`${index + 1}`} /><View style={{ flex: 1 }}><Text style={styles.title}>{s.name}</Text><Muted>{s.category}</Muted></View>{s.is_default ? <Pill text="DEFAULT" /> : null}</View><View style={styles.actions}><Button kind="secondary" title="↑" onPress={() => move(index, -1)} /><Button kind="secondary" title="↓" onPress={() => move(index, 1)} /><Button kind="danger" title="Xóa" onPress={() => Alert.alert('Xóa status?', s.name, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(s.id) }])} /></View></Card>)}
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>Tạo status</Text><Field placeholder="Tên status" value={name} onChangeText={setName} /><View style={styles.wrap}>{categories.map((c) => <Pressable key={c} onPress={() => setCategory(c)} style={[styles.choice, category === c && styles.active]}><Text style={styles.choiceText}>{c}</Text></Pressable>)}</View><Button title="Tạo" disabled={!name.trim() || create.isPending} onPress={() => create.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} /></View></View></Modal>
  </Screen>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật workflow', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, title: { color: '#eef2f6', fontWeight: '800' }, actions: { flexDirection: 'row', gap: 8 }, wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, choice: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' }, active: { backgroundColor: '#2388ff' }, choiceText: { color: '#fff', fontSize: 10, fontWeight: '800' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }, sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' } });
