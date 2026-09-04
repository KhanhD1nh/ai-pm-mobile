import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Muted, Pill } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { settingsApi } from '@/services/api';

export default function SystemUsersScreen() {
  const { user, orgId } = useAuth();
  const qc = useQueryClient();
  const isOwner = Boolean(user?.isSystemOwner || user?.is_system_owner);
  const users = useQuery({ queryKey: ['system-users'], queryFn: settingsApi.systemUsers, enabled: isOwner });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const create = useMutation({ mutationFn: () => settingsApi.createSystemUser({ name: name.trim(), email: email.trim(), password, orgId: orgId ?? undefined, role: 'MEMBER' }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['system-users'] }); setOpen(false); setName(''); setEmail(''); setPassword(''); }, onError: showError });
  const remove = useMutation({ mutationFn: settingsApi.deleteSystemUser, onSuccess: () => qc.invalidateQueries({ queryKey: ['system-users'] }), onError: showError });
  if (!isOwner) return <Screen title="System Users"><Muted>Chỉ System Owner có quyền truy cập.</Muted></Screen>;
  return <Screen title="System Users" subtitle={`${users.data?.length ?? 0} users`} right={<Button title="+ User" onPress={() => setOpen(true)} />} refreshing={users.isRefetching} onRefresh={() => void users.refetch()}>
    {(users.data ?? []).map((u: any) => <Card key={u.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>{u.name}</Text><Muted>{u.email}</Muted></View>{u.isSystemOwner ? <Pill text="SYSTEM OWNER" /> : null}</View><View style={styles.workspaces}>{(u.workspaces ?? []).map((w: any) => <Pill key={`${u.id}-${w.orgId}`} text={`${w.orgName} · ${w.role}`} />)}</View>{!u.isSystemOwner ? <Button kind="danger" title="Xóa user" onPress={() => Alert.alert('Xóa user?', u.email, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(u.id) }])} /> : null}</Card>)}
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>Tạo System User</Text><Field placeholder="Tên" value={name} onChangeText={setName} /><Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><Field placeholder="Mật khẩu" secureTextEntry value={password} onChangeText={setPassword} /><Button title="Tạo" disabled={!name.trim() || !email.trim() || password.length < 8 || create.isPending} onPress={() => create.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} /></View></View></Modal>
  </Screen>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật user', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: '#eef2f6', fontWeight: '900' }, workspaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }, sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' } });
