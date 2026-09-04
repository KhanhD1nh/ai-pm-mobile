import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { registerForPushNotifications, syncAppBadge } from '@/services/notifications';
import { isBiometricLockEnabled, setBiometricLockEnabled } from '@/services/security';
import { settingsApi } from '@/services/api';

export default function MobileSettingsScreen() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const devices = useQuery({ queryKey: ['notification-devices'], queryFn: settingsApi.devices });
  useEffect(() => { void isBiometricLockEnabled().then(setBiometric); }, []);

  const enablePush = async () => {
    setBusy(true);
    try {
      await registerForPushNotifications();
      await qc.invalidateQueries({ queryKey: ['notification-devices'] });
      await syncAppBadge();
      Alert.alert('Push notifications đã bật');
    } catch (e) { Alert.alert('Không thể bật push', e instanceof Error ? e.message : 'Có lỗi xảy ra'); }
    finally { setBusy(false); }
  };

  const toggleBiometric = async (next: boolean) => {
    try {
      await setBiometricLockEnabled(next);
      setBiometric(next);
    } catch (e) {
      Alert.alert('Không thể thay đổi App Lock', e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  return <Screen title="Mobile settings" subtitle={Platform.OS === 'ios' ? 'iOS' : 'Android'} refreshing={devices.isRefetching} onRefresh={() => void devices.refetch()}>
    <SectionTitle>Push Notifications</SectionTitle>
    <Card><Muted>Đăng ký thiết bị này với Notification Engine để nhận thông báo khi app background hoặc đã đóng.</Muted><Button title={busy ? 'Đang đăng ký...' : 'Bật Push Notification'} disabled={busy} onPress={() => void enablePush()} /></Card>
    {(devices.data ?? []).map((device: any) => <Card key={device.id}><Text style={styles.title}>{device.device_name ?? device.platform}</Text><Pill text={`${device.push_provider} · ${device.enabled ? 'ENABLED' : 'DISABLED'}`} /><Muted>Last seen {new Date(device.last_seen_at).toLocaleString('vi-VN')}</Muted>{device.enabled ? <Button kind="danger" title="Tắt thiết bị" onPress={() => void settingsApi.disableDevice(device.id).then(() => qc.invalidateQueries({ queryKey: ['notification-devices'] }))} /> : null}</Card>)}
    <SectionTitle>Security</SectionTitle>
    <Card><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>Biometric App Lock</Text><Muted>Khóa AI-PM bằng Face ID / Touch ID / fingerprint mỗi khi quay lại app.</Muted></View><Switch value={biometric} onValueChange={(value) => void toggleBiometric(value)} /></View></Card>
    <SectionTitle>Offline</SectionTitle>
    <Card><Muted>Projects, issues và inbox được persist trong local query cache trong 24 giờ. Khi mất mạng, app vẫn hiển thị dữ liệu gần nhất và tự refetch khi kết nối trở lại.</Muted></Card>
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: '#eef2f6', fontWeight: '900' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
