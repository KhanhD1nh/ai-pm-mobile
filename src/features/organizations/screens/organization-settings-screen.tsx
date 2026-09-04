import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Label, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import type { Organization } from '@/shared/contracts';
import { useAiBudget, useOrganizationMembers } from '../queries/use-organization-admin';
import {
  useAddOrganizationMember,
  useRemoveOrganizationMember,
  useUpdateOrganization,
  useUpdateOrganizationMember,
} from '../mutations/use-organization-mutations';

const roles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

export default function OrganizationScreen() {
  const { organizations, orgId, refreshOrganizations } = useAuth();
  const org = organizations.find((item) => item.id === orgId);
  const members = useOrganizationMembers(orgId);
  const budget = useAiBudget(orgId);
  const updateOrg = useUpdateOrganization(orgId);
  const addMember = useAddOrganizationMember(orgId);
  const updateMember = useUpdateOrganizationMember(orgId);
  const removeMember = useRemoveOrganizationMember(orgId);
  const [email, setEmail] = useState('');

  if (!org) return <Screen title="Organization"><Muted>Chưa chọn workspace.</Muted></Screen>;

  const onError = (error: unknown) => presentError('Không thể cập nhật workspace', error);
  const saveWorkspace = (name: string) => updateOrg.mutate(name, {
    onSuccess: async () => {
      await refreshOrganizations();
      Alert.alert('Đã lưu workspace');
    },
    onError,
  });
  const addWorkspaceMember = () => addMember.mutate(
    { email: email.trim(), role: 'MEMBER' },
    { onSuccess: () => setEmail(''), onError },
  );

  return (
    <Screen
      title={org.name}
      subtitle={org.role ?? 'System Owner'}
      refreshing={members.isRefetching}
      onRefresh={() => {
        void members.refetch();
        void budget.refetch();
      }}
    >
      <OrganizationNameForm
        key={`${org.id}-${org.name}`}
        organization={org}
        saving={updateOrg.isPending}
        onSubmit={saveWorkspace}
      />

      <SectionTitle>AI Budget</SectionTitle>
      <Card>
        <View style={styles.row}>
          <View><Muted>Monthly limit</Muted><Text style={styles.big}>${budget.data?.monthlyUsdLimit ?? 0}</Text></View>
          <View><Muted>Current usage</Muted><Text style={styles.big}>${budget.data?.currentUsageUsd ?? 0}</Text></View>
        </View>
        <Muted>Alert at {budget.data?.alertThresholdPct ?? 80}% · reset day {budget.data?.resetDay ?? 1}</Muted>
      </Card>

      <SectionTitle>Members</SectionTitle>
      <Card>
        <Field placeholder="Email thành viên mới" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Button title="Thêm MEMBER" disabled={!email.trim() || addMember.isPending} onPress={addWorkspaceMember} />
      </Card>

      {(members.data ?? []).map((member: any) => {
        const memberName = member.name ?? member.user?.name ?? member.email ?? 'User';
        const memberEmail = member.email ?? member.user?.email ?? '';
        return (
          <Card key={member.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Text style={styles.title}>{memberName}</Text><Muted>{memberEmail}</Muted></View>
              <Pill text={member.role} />
            </View>
            <View style={styles.wrap}>
              {roles.map((role) => (
                <Pressable
                  key={role}
                  onPress={() => updateMember.mutate({ id: member.id, role }, { onError })}
                  style={[styles.choice, member.role === role && styles.active]}
                >
                  <Text style={styles.choiceText}>{role}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => Alert.alert('Xóa khỏi workspace?', memberName, [
                  { text: 'Hủy' },
                  { text: 'Xóa', style: 'destructive', onPress: () => removeMember.mutate(member.id, { onError }) },
                ])}
                style={[styles.choice, styles.danger]}
              >
                <Text style={styles.choiceText}>REMOVE</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function OrganizationNameForm({ organization, saving, onSubmit }: { organization: Organization; saving: boolean; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(organization.name);
  return (
    <Card>
      <Label>Workspace name</Label>
      <Field value={name} onChangeText={setName} />
      <Button title="Lưu" disabled={!name.trim() || saving} onPress={() => onSubmit(name.trim())} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  big: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' },
  title: { color: '#eef2f6', fontWeight: '800' },
  wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  choice: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' },
  active: { backgroundColor: '#2388ff' },
  danger: { backgroundColor: '#6d2730' },
  choiceText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
