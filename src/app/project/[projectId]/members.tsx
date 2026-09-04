import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { projectsApi, settingsApi } from '@/services/api';

const roles = ['LEAD', 'MEMBER', 'VIEWER'];

export default function MembersScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const members = useQuery({ queryKey: ['project-members', projectId], queryFn: () => projectsApi.members(projectId!), enabled: !!projectId });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const users = useQuery({ queryKey: ['users', query], queryFn: () => settingsApi.users(query), enabled: open && query.trim().length > 1 });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const add = useMutation({ mutationFn: () => projectsApi.addMember(projectId!, selectedUserId, role), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['project-members', projectId] }); setOpen(false); setQuery(''); setSelectedUserId(''); }, onError: showError });
  const update = useMutation({ mutationFn: ({ userId, nextRole }: { userId: string; nextRole: string }) => projectsApi.updateMember(projectId!, userId, nextRole), onSuccess: () => qc.invalidateQueries({ queryKey: ['project-members', projectId] }), onError: showError });
  const remove = useMutation({ mutationFn: (userId: string) => projectsApi.removeMember(projectId!, userId), onSuccess: () => qc.invalidateQueries({ queryKey: ['project-members', projectId] }), onError: showError });

  return <Screen title={`Members · ${project.data?.key ?? ''}`} subtitle={`${members.data?.length ?? 0} thành viên`} right={<Button title="+ Thêm" onPress={() => setOpen(true)} />} refreshing={members.isRefetching} onRefresh={() => void members.refetch()}>
    {(members.data ?? []).map((m) => <Card key={m.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>{m.name}</Text><Muted>{m.email}</Muted></View><Pill text={m.role} /></View><View style={styles.wrap}>{roles.map((r) => <Pressable key={r} onPress={() => update.mutate({ userId: m.id, nextRole: r })} style={[styles.choice, m.role === r && styles.active]}><Text style={styles.choiceText}>{r}</Text></Pressable>)}<Pressable onPress={() => Alert.alert('Xóa thành viên?', m.name, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(m.id) }])} style={[styles.choice, styles.danger]}><Text style={styles.choiceText}>REMOVE</Text></Pressable></View></Card>)}
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>Thêm thành viên</Text><Field placeholder="Tìm theo tên/email" value={query} onChangeText={setQuery} />{(users.data ?? []).slice(0, 8).map((u) => <Pressable key={u.id} onPress={() => setSelectedUserId(u.id)} style={[styles.user, selectedUserId === u.id && styles.active]}><Text style={styles.title}>{u.name}</Text><Muted>{u.email}</Muted></Pressable>)}<View style={styles.wrap}>{roles.map((r) => <Pressable key={r} onPress={() => setRole(r)} style={[styles.choice, role === r && styles.active]}><Text style={styles.choiceText}>{r}</Text></Pressable>)}</View><Button title="Thêm" disabled={!selectedUserId || add.isPending} onPress={() => add.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} /></View></View></Modal>
  </Screen>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật thành viên', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: '#eef2f6', fontWeight: '800' }, wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, choice: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' }, active: { backgroundColor: '#2388ff' }, danger: { backgroundColor: '#6d2730' }, choiceText: { color: '#fff', fontSize: 11, fontWeight: '800' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }, sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' }, user: { padding: 10, borderRadius: 12, backgroundColor: '#17212b' } });
