import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Field, Pill } from '@/shared/components/ui/primitives';
import { BottomSheet, ChoiceRow, GlassIconButton, ListGroup, SectionHeader } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import { Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { useMemberSearch, useProjectMembers } from '../queries/use-members';
import { useAddProjectMembersBatch, useRemoveProjectMember, useUpdateProjectMemberRole } from '../mutations/use-member-mutations';

const roles = ['LEAD', 'MEMBER', 'VIEWER'];

export default function MembersScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project, members } = useProjectMembers(projectId);
  const add = useAddProjectMembersBatch(projectId);
  const update = useUpdateProjectMemberRole(projectId);
  const remove = useRemoveProjectMember(projectId);
  const [open, setOpen] = useState(false);
  const [roleSheet, setRoleSheet] = useState<{ id: string; name: string; role: string } | null>(null);
  const [query, setQuery] = useState('');
  const users = useMemberSearch(query, open, projectId);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [role, setRole] = useState('MEMBER');
  const onError = (error: unknown) => presentError(language === 'vi' ? 'Không thể cập nhật thành viên' : 'Could not update member', error);

  const existingIds = useMemo(() => new Set((members.data ?? []).map((member) => member.id)), [members.data]);
  const candidates = (users.data ?? []).filter((user) => !existingIds.has(user.id)).slice(0, 20);
  const toggleUser = (userId: string) => setSelectedUserIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
  const closeAdd = () => { setOpen(false); setQuery(''); setSelectedUserIds([]); setRole('MEMBER'); };
  const submit = () => add.mutate({ userIds: selectedUserIds, role }, {
    onSuccess: (result) => {
      closeAdd();
      if (result.skippedCount > 0) Alert.alert(language === 'vi' ? 'Đã thêm thành viên' : 'Members added', language === 'vi' ? `${result.added.length} người được thêm, ${result.skippedCount} người đã có trong dự án.` : `${result.added.length} added, ${result.skippedCount} already belonged to the project.`);
    },
    onError,
  });

  return (
    <Screen
      chrome="stack"
      title={language === 'vi' ? 'Thành viên' : 'Members'}
      subtitle={`${project.data?.key ?? ''} · ${members.data?.length ?? 0}`}
      refreshing={members.isRefetching}
      onRefresh={() => void members.refetch()}
      right={<GlassIconButton icon="person-add-outline" label={language === 'vi' ? 'Thêm người' : 'Add member'} onPress={() => setOpen(true)} />}
    >
      <SectionHeader title={language === 'vi' ? 'Nhóm dự án' : 'Project team'} />
      <ListGroup variant="plain">
        {(members.data ?? []).map((member, index) => (
          <MotionPressable accessibilityRole="button" accessibilityLabel={`${member.name}, ${member.email}, ${member.role}`} key={member.id} onPress={() => setRoleSheet({ id: member.id, name: member.name, role: member.role })} style={[styles.memberRow, index > 0 && styles.border]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.copy}><Text style={styles.name}>{member.name}</Text><Text style={styles.email}>{member.email}</Text></View>
            <Pill text={member.role} tone={member.role === 'LEAD' ? 'accent' : 'neutral'} />
            <Ionicons accessible={false} name="chevron-forward" size={17} color={ui.colors.textMuted} />
          </MotionPressable>
        ))}
      </ListGroup>

      <BottomSheet visible={Boolean(roleSheet)} title={roleSheet?.name ?? ''} subtitle={language === 'vi' ? 'Vai trò trong dự án' : 'Project role'} onClose={() => setRoleSheet(null)}>
        {roles.map((item) => <ChoiceRow key={item} label={item} active={roleSheet?.role === item} onPress={() => roleSheet && update.mutate({ userId: roleSheet.id, role: item }, { onSuccess: () => setRoleSheet({ ...roleSheet, role: item }), onError })} />)}
        <MotionPressable onPress={() => roleSheet && Alert.alert(language === 'vi' ? 'Xóa thành viên?' : 'Remove member?', roleSheet.name, [
          { text: language === 'vi' ? 'Hủy' : 'Cancel' },
          { text: language === 'vi' ? 'Xóa' : 'Remove', style: 'destructive', onPress: () => remove.mutate(roleSheet.id, { onSuccess: () => setRoleSheet(null), onError }) },
        ])} style={styles.removeRow}><Ionicons accessible={false} name="person-remove-outline" size={18} color={ui.colors.danger} /><Text style={styles.removeText}>{language === 'vi' ? 'Xóa khỏi dự án' : 'Remove from project'}</Text></MotionPressable>
      </BottomSheet>

      <BottomSheet visible={open} title={language === 'vi' ? 'Thêm thành viên' : 'Add members'} subtitle={project.data?.name} onClose={closeAdd} footer={<Button title={add.isPending ? (language === 'vi' ? 'Đang thêm…' : 'Adding…') : selectedUserIds.length > 1 ? (language === 'vi' ? `Thêm ${selectedUserIds.length} thành viên` : `Add ${selectedUserIds.length} members`) : (language === 'vi' ? 'Thêm thành viên' : 'Add member')} disabled={selectedUserIds.length === 0 || add.isPending} onPress={submit} />}>
        <Field placeholder={language === 'vi' ? 'Tìm tên hoặc email…' : 'Search name or email…'} value={query} onChangeText={setQuery} autoFocus />
        {query.trim().length > 1 && candidates.length === 0 && !users.isFetching ? <Text style={styles.emptyHint}>{language === 'vi' ? 'Không tìm thấy người dùng chưa có trong dự án.' : 'No matching users outside this project.'}</Text> : null}
        {candidates.map((user) => <ChoiceRow key={user.id} label={user.name} description={user.email} active={selectedUserIds.includes(user.id)} onPress={() => toggleUser(user.id)} />)}
        {selectedUserIds.length > 0 ? <Text style={styles.selectionHint}>{language === 'vi' ? `Đã chọn ${selectedUserIds.length} người` : `${selectedUserIds.length} selected`}</Text> : null}
        <Text style={styles.sheetLabel}>{language === 'vi' ? 'Vai trò' : 'Role'}</Text>
        {roles.map((item) => <ChoiceRow key={item} label={item} active={role === item} onPress={() => setRole(item)} />)}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  memberRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.colors.border },
  avatar: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  avatarText: { color: ui.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  copy: { flex: 1, minWidth: 0 },
  name: { color: ui.colors.text, ...ui.typography.bodyStrong },
  email: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  removeRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderRadius: ui.radius.md, backgroundColor: ui.colors.dangerSoft, marginTop: 8 },
  removeText: { color: ui.colors.danger, ...ui.typography.bodyStrong },
  sheetLabel: { color: ui.colors.textMuted, ...ui.typography.eyebrow, marginTop: 8, marginBottom: 2 },
  selectionHint: { color: ui.colors.accentStrong, ...ui.typography.caption, fontWeight: '700', paddingHorizontal: 2 },
  emptyHint: { color: ui.colors.textMuted, ...ui.typography.body, paddingVertical: 10 },
});

