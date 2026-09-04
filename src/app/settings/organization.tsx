import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Label, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { organizationsApi } from '@/services/api';

const roles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

export default function OrganizationScreen() {
  const { organizations, orgId, refreshOrganizations } = useAuth();
  const qc = useQueryClient();
  const org = organizations.find((x) => x.id === orgId);
  const [name, setName] = useState(org?.name ?? '');
  const [email, setEmail] = useState('');
  useEffect(() => setName(org?.name ?? ''), [org?.name]);
  const members = useQuery({ queryKey: ['org-members', orgId], queryFn: () => organizationsApi.members(orgId!), enabled: !!orgId });
  const budget = useQuery({ queryKey: ['ai-budget', orgId], queryFn: () => organizationsApi.aiBudget(orgId!), enabled: !!orgId });
  const updateOrg = useMutation({ mutationFn: () => organizationsApi.update(orgId!, name.trim()), onSuccess: async () => { await refreshOrganizations(); Alert.alert('Đã lưu workspace'); }, onError: showError });
  const addMember = useMutation({ mutationFn: () => organizationsApi.addMember(orgId!, email.trim(), 'MEMBER'), onSuccess: async () => { setEmail(''); await qc.invalidateQueries({ queryKey: ['org-members', orgId] }); }, onError: showError });
  const updateMember = useMutation({ mutationFn: ({ id, role }: { id: string; role: string }) => organizationsApi.updateMember(orgId!, id, role), onSuccess: () => qc.invalidateQueries({ queryKey: ['org-members', orgId] }), onError: showError });
  const removeMember = useMutation({ mutationFn: (id: string) => organizationsApi.removeMember(orgId!, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['org-members', orgId] }), onError: showError });
  if (!org) return <Screen title="Organization"><Muted>Chưa chọn workspace.</Muted></Screen>;
  return <Screen title={org.name} subtitle={org.role ?? 'System Owner'} refreshing={members.isRefetching} onRefresh={() => { void members.refetch(); void budget.refetch(); }}>
    <Card><Label>Workspace name</Label><Field value={name} onChangeText={setName} /><Button title="Lưu" disabled={!name.trim() || updateOrg.isPending} onPress={() => updateOrg.mutate()} /></Card>
    <SectionTitle>AI Budget</SectionTitle>
    <Card><View style={styles.row}><View><Muted>Monthly limit</Muted><Text style={styles.big}>${budget.data?.monthlyUsdLimit ?? 0}</Text></View><View><Muted>Current usage</Muted><Text style={styles.big}>${budget.data?.currentUsageUsd ?? 0}</Text></View></View><Muted>Alert at {budget.data?.alertThresholdPct ?? 80}% · reset day {budget.data?.resetDay ?? 1}</Muted></Card>
    <SectionTitle>Members</SectionTitle>
    <Card><Field placeholder="Email thành viên mới" autoCapitalize="none" value={email} onChangeText={setEmail} /><Button title="Thêm MEMBER" disabled={!email.trim() || addMember.isPending} onPress={() => addMember.mutate()} /></Card>
    {(members.data ?? []).map((m: any) => {
      const memberName = m.name ?? m.user?.name ?? m.email ?? 'User';
      const memberEmail = m.email ?? m.user?.email ?? '';
      return <Card key={m.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>{memberName}</Text><Muted>{memberEmail}</Muted></View><Pill text={m.role} /></View><View style={styles.wrap}>{roles.map((role) => <Pressable key={role} onPress={() => updateMember.mutate({ id: m.id, role })} style={[styles.choice, m.role === role && styles.active]}><Text style={styles.choiceText}>{role}</Text></Pressable>)}<Pressable onPress={() => Alert.alert('Xóa khỏi workspace?', memberName, [{ text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => removeMember.mutate(m.id) }])} style={[styles.choice, styles.danger]}><Text style={styles.choiceText}>REMOVE</Text></Pressable></View></Card>;
    })}
  </Screen>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật workspace', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }, big: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' }, title: { color: '#eef2f6', fontWeight: '800' }, wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, choice: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' }, active: { backgroundColor: '#2388ff' }, danger: { backgroundColor: '#6d2730' }, choiceText: { color: '#fff', fontSize: 10, fontWeight: '800' } });
