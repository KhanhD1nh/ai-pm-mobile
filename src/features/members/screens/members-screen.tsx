import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useMemberSearch, useProjectMembers } from '../queries/use-members';
import { useAddProjectMember, useRemoveProjectMember, useUpdateProjectMemberRole } from '../mutations/use-member-mutations';

const roles = ['LEAD', 'MEMBER', 'VIEWER'];

export default function MembersScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, members } = useProjectMembers(projectId);
  const add = useAddProjectMember(projectId);
  const update = useUpdateProjectMemberRole(projectId);
  const remove = useRemoveProjectMember(projectId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const users = useMemberSearch(query, open);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const onError = (error: unknown) => presentError('Không thể cập nhật thành viên', error);

  const submit = () => add.mutate(
    { userId: selectedUserId, role },
    {
      onSuccess: () => {
        setOpen(false);
        setQuery('');
        setSelectedUserId('');
      },
      onError,
    },
  );

  return (
    <Screen
      title={`Members · ${project.data?.key ?? ''}`}
      subtitle={`${members.data?.length ?? 0} thành viên`}
      right={<Button title="+ Thêm" onPress={() => setOpen(true)} />}
      refreshing={members.isRefetching}
      onRefresh={() => void members.refetch()}
    >
      {(members.data ?? []).map((member) => (
        <Card key={member.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.title}>{member.name}</Text><Muted>{member.email}</Muted></View>
            <Pill text={member.role} />
          </View>
          <View style={styles.wrap}>
            {roles.map((item) => (
              <Pressable
                key={item}
                onPress={() => update.mutate({ userId: member.id, role: item }, { onError })}
                style={[styles.choice, member.role === item && styles.active]}
              >
                <Text style={styles.choiceText}>{item}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => Alert.alert('Xóa thành viên?', member.name, [
                { text: 'Hủy' },
                { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(member.id, { onError }) },
              ])}
              style={[styles.choice, styles.danger]}
            >
              <Text style={styles.choiceText}>REMOVE</Text>
            </Pressable>
          </View>
        </Card>
      ))}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Thêm thành viên</Text>
            <Field placeholder="Tìm theo tên/email" value={query} onChangeText={setQuery} />
            {(users.data ?? []).slice(0, 8).map((user) => (
              <Pressable key={user.id} onPress={() => setSelectedUserId(user.id)} style={[styles.user, selectedUserId === user.id && styles.active]}>
                <Text style={styles.title}>{user.name}</Text><Muted>{user.email}</Muted>
              </Pressable>
            ))}
            <View style={styles.wrap}>
              {roles.map((item) => (
                <Pressable key={item} onPress={() => setRole(item)} style={[styles.choice, role === item && styles.active]}>
                  <Text style={styles.choiceText}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Thêm" disabled={!selectedUserId || add.isPending} onPress={submit} />
            <Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#eef2f6', fontWeight: '800' },
  wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  choice: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' },
  active: { backgroundColor: '#2388ff' },
  danger: { backgroundColor: '#6d2730' },
  choiceText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
  user: { padding: 10, borderRadius: 12, backgroundColor: '#17212b' },
});
