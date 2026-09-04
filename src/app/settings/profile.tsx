import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Field, Label, Muted, SectionTitle } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { settingsApi } from '@/services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  useEffect(() => setName(user?.name ?? ''), [user?.name]);
  const save = useMutation({ mutationFn: () => settingsApi.updateMe({ name: name.trim() }), onSuccess: () => Alert.alert('Đã lưu hồ sơ'), onError: showError });
  const password = useMutation({ mutationFn: () => settingsApi.changePassword(currentPassword, newPassword), onSuccess: () => { setCurrentPassword(''); setNewPassword(''); Alert.alert('Đã đổi mật khẩu'); }, onError: showError });
  return <Screen title="Profile" subtitle={user?.email}>
    <Card><Label>Tên</Label><Field value={name} onChangeText={setName} /><Label>Email</Label><Text style={styles.value}>{user?.email}</Text><Muted>{user?.isSystemOwner || user?.is_system_owner ? 'System Owner' : 'User'}</Muted><Button title={save.isPending ? 'Đang lưu...' : 'Lưu hồ sơ'} disabled={!name.trim() || save.isPending} onPress={() => save.mutate()} /></Card>
    <SectionTitle>Đổi mật khẩu</SectionTitle>
    <Card><Field secureTextEntry placeholder="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} /><Field secureTextEntry placeholder="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} /><Button title={password.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'} disabled={!currentPassword || newPassword.length < 8 || password.isPending} onPress={() => password.mutate()} /></Card>
    <Button kind="danger" title="Đăng xuất" onPress={() => void logout()} />
  </Screen>;
}
function showError(error: unknown) { Alert.alert('Không thể cập nhật hồ sơ', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ value: { color: '#eef2f6', fontWeight: '800' } });
