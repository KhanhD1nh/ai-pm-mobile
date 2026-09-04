import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useMobileSettings } from '../hooks/use-mobile-settings';

export default function MobileSettingsScreen() {
  const { devices, busy, biometric, enablePush, disableDevice, toggleBiometric } = useMobileSettings();

  const handleEnablePush = async () => {
    try {
      await enablePush();
      Alert.alert('Push notifications đã bật');
    } catch (error) {
      presentError('Không thể bật push', error);
    }
  };

  const handleBiometric = async (next: boolean) => {
    try {
      await toggleBiometric(next);
    } catch (error) {
      presentError('Không thể thay đổi App Lock', error);
    }
  };

  return (
    <Screen
      title="Mobile settings"
      subtitle={Platform.OS === 'ios' ? 'iOS' : 'Android'}
      refreshing={devices.isRefetching}
      onRefresh={() => void devices.refetch()}
    >
      <SectionTitle>Push Notifications</SectionTitle>
      <Card>
        <Muted>Đăng ký thiết bị này với Notification Engine để nhận thông báo khi app background hoặc đã đóng.</Muted>
        <Button title={busy ? 'Đang đăng ký...' : 'Bật Push Notification'} disabled={busy} onPress={() => void handleEnablePush()} />
      </Card>
      {(devices.data ?? []).map((device) => (
        <Card key={device.id}>
          <Text style={styles.title}>{device.device_name ?? device.platform}</Text>
          <Pill text={`${device.push_provider} · ${device.enabled ? 'ENABLED' : 'DISABLED'}`} />
          <Muted>Last seen {new Date(device.last_seen_at).toLocaleString('vi-VN')}</Muted>
          {device.enabled ? (
            <Button
              kind="danger"
              title="Tắt thiết bị"
              onPress={() => void disableDevice(device.id).catch((error) => presentError('Không thể tắt thiết bị', error))}
            />
          ) : null}
        </Card>
      ))}

      <SectionTitle>Security</SectionTitle>
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Biometric App Lock</Text>
            <Muted>Khóa AI-PM bằng Face ID / Touch ID / fingerprint mỗi khi quay lại app.</Muted>
          </View>
          <Switch value={biometric} onValueChange={(value) => void handleBiometric(value)} />
        </View>
      </Card>

      <SectionTitle>Offline</SectionTitle>
      <Card>
        <Muted>Projects, issues và inbox được persist trong local query cache trong 24 giờ. Khi mất mạng, app vẫn hiển thị dữ liệu gần nhất và tự refetch khi kết nối trở lại.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#eef2f6', fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
