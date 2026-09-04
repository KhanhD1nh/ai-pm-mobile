import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Muted, Pill } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import { useSystemUsers } from '../queries/use-system-users';
import { useCreateSystemUser, useDeleteSystemUser } from '../mutations/use-system-user-mutations';

export default function SystemUsersScreen() {
  const { user, orgId } = useAuth();
  const isOwner = Boolean(user?.isSystemOwner || user?.is_system_owner);
  const users = useSystemUsers(isOwner);
  const create = useCreateSystemUser();
  const remove = useDeleteSystemUser();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const onError = (error: unknown) => presentError('Không thể cập nhật user', error);

  if (!isOwner) return <Screen title="System Users"><Muted>Chỉ System Owner có quyền truy cập.</Muted></Screen>;

  const submit = () => create.mutate(
    { name: name.trim(), email: email.trim(), password, orgId: orgId ?? undefined, role: 'MEMBER' },
    {
      onSuccess: () => {
        setOpen(false);
        setName('');
        setEmail('');
        setPassword('');
      },
      onError,
    },
  );

  return (
    <Screen
      title="System Users"
      subtitle={`${users.data?.length ?? 0} users`}
      right={<Button title="+ User" onPress={() => setOpen(true)} />}
      refreshing={users.isRefetching}
      onRefresh={() => void users.refetch()}
    >
      {(users.data ?? []).map((item) => (
        <Card key={item.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.title}>{item.name}</Text><Muted>{item.email}</Muted></View>
            {item.isSystemOwner ? <Pill text="SYSTEM OWNER" /> : null}
          </View>
          <View style={styles.workspaces}>
            {(item.workspaces ?? []).map((workspace) => <Pill key={`${item.id}-${workspace.orgId}`} text={`${workspace.orgName} · ${workspace.role}`} />)}
          </View>
          {!item.isSystemOwner ? (
            <Button
              kind="danger"
              title="Xóa user"
              onPress={() => Alert.alert('Xóa user?', item.email, [
                { text: 'Hủy' },
                { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(item.id, { onError }) },
              ])}
            />
          ) : null}
        </Card>
      ))}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo System User</Text>
            <Field placeholder="Tên" value={name} onChangeText={setName} />
            <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Field placeholder="Mật khẩu" secureTextEntry value={password} onChangeText={setPassword} />
            <Button title="Tạo" disabled={!name.trim() || !email.trim() || password.length < 8 || create.isPending} onPress={submit} />
            <Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#eef2f6', fontWeight: '900' },
  workspaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
});
