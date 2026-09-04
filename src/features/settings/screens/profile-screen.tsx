import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button, Card, Field, Label, Muted, SectionTitle } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import type { User } from '@/shared/contracts';
import { useChangePassword, useUpdateProfile } from '../mutations/use-profile-mutations';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const save = useUpdateProfile();
  const password = useChangePassword();
  const onError = (error: unknown) => presentError('Không thể cập nhật hồ sơ', error);

  return (
    <Screen title="Profile" subtitle={user?.email}>
      {user ? (
        <ProfileForm
          key={`${user.id}-${user.name}`}
          user={user}
          saving={save.isPending}
          onSave={(name) => save.mutate(name, { onSuccess: () => Alert.alert('Đã lưu hồ sơ'), onError })}
        />
      ) : null}
      <PasswordForm
        changing={password.isPending}
        onSubmit={(currentPassword, newPassword, reset) => password.mutate(
          { currentPassword, newPassword },
          {
            onSuccess: () => {
              reset();
              Alert.alert('Đã đổi mật khẩu');
            },
            onError,
          },
        )}
      />
      <Button kind="danger" title="Đăng xuất" onPress={() => void logout()} />
    </Screen>
  );
}

function ProfileForm({ user, saving, onSave }: { user: User; saving: boolean; onSave: (name: string) => void }) {
  const [name, setName] = useState(user.name ?? '');
  return (
    <Card>
      <Label>Tên</Label>
      <Field value={name} onChangeText={setName} />
      <Label>Email</Label>
      <Text style={styles.value}>{user.email}</Text>
      <Muted>{user.isSystemOwner || user.is_system_owner ? 'System Owner' : 'User'}</Muted>
      <Button
        title={saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
        disabled={!name.trim() || saving}
        onPress={() => onSave(name.trim())}
      />
    </Card>
  );
}

function PasswordForm({ changing, onSubmit }: { changing: boolean; onSubmit: (currentPassword: string, newPassword: string, reset: () => void) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <>
      <SectionTitle>Đổi mật khẩu</SectionTitle>
      <Card>
        <Field secureTextEntry placeholder="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} />
        <Field secureTextEntry placeholder="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} />
        <Button
          title={changing ? 'Đang đổi...' : 'Đổi mật khẩu'}
          disabled={!currentPassword || newPassword.length < 8 || changing}
          onPress={() => onSubmit(currentPassword, newPassword, reset)}
        />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({ value: { color: '#eef2f6', fontWeight: '800' } });
