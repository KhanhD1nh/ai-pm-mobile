import { Alert, Platform, Switch, Text, View } from 'react-native';
import { Button } from '@/shared/components/ui/primitives';
import { ListGroup, ListRow, SectionHeader } from '@/shared/components/ui/mobile';
import { Screen } from '@/shared/components/ui/screen';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { useMobileSettings } from '../hooks/use-mobile-settings';

export default function MobileSettingsScreen() {
  const { theme: ui, language } = useAppPreferences();
  const { devices, busy, biometric, enablePush, disableDevice, toggleBiometric } = useMobileSettings();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  const handleEnablePush = async () => {
    try {
      await enablePush();
      Alert.alert(language === 'vi' ? 'Đã bật thông báo đẩy' : 'Push notifications enabled');
    } catch (error) {
      presentError(language === 'vi' ? 'Không thể bật push' : 'Could not enable push', error);
    }
  };

  const handleBiometric = async (next: boolean) => {
    try {
      await toggleBiometric(next);
    } catch (error) {
      presentError(language === 'vi' ? 'Không thể thay đổi App Lock' : 'Could not change App Lock', error);
    }
  };

  return (
    <Screen chrome="stack" title={language === 'vi' ? 'Cài đặt thiết bị' : 'Device settings'} subtitle={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'web' ? 'Web' : 'Android'} refreshing={devices.isRefetching} onRefresh={() => void devices.refetch()}>
      <SectionHeader title={language === 'vi' ? 'Thông báo' : 'Notifications'} caption={language === 'vi' ? 'Cách AI-PM liên hệ với bạn' : 'How AI-PM reaches you'} />
      <ListGroup>
        <ListRow first icon="notifications-outline" label={language === 'vi' ? 'Push notifications' : 'Push notifications'} detail={language === 'vi' ? 'Nhận thông báo khi app đang nền hoặc đã đóng.' : 'Receive alerts while the app is backgrounded or closed.'} trailing={<Button title={busy ? '…' : (language === 'vi' ? 'Bật' : 'Enable')} disabled={busy || Platform.OS === 'web'} onPress={() => void handleEnablePush()} />} />
      </ListGroup>

      {(devices.data ?? []).length > 0 ? <>
        <SectionHeader title={language === 'vi' ? 'Thiết bị đã đăng ký' : 'Registered devices'} />
        <ListGroup>
          {(devices.data ?? []).map((device, index) => (
            <ListRow
              key={device.id}
              first={index === 0}
              icon="phone-portrait-outline"
              label={device.device_name ?? device.platform}
              detail={`${device.push_provider} · ${language === 'vi' ? 'Lần cuối' : 'Last seen'} ${new Date(device.last_seen_at).toLocaleString(locale)}`}
              value={device.enabled ? 'ON' : 'OFF'}
              onPress={device.enabled ? () => Alert.alert(language === 'vi' ? 'Tắt thông báo trên thiết bị này?' : 'Disable notifications on this device?', undefined, [
                { text: language === 'vi' ? 'Hủy' : 'Cancel' },
                { text: language === 'vi' ? 'Tắt' : 'Disable', style: 'destructive', onPress: () => void disableDevice(device.id).catch((error) => presentError(language === 'vi' ? 'Không thể tắt thiết bị' : 'Could not disable device', error)) },
              ]) : undefined}
            />
          ))}
        </ListGroup>
      </> : null}

      <SectionHeader title={language === 'vi' ? 'Bảo mật' : 'Security'} />
      <ListGroup>
        <ListRow first icon="finger-print-outline" label={language === 'vi' ? 'Khóa sinh trắc học' : 'Biometric App Lock'} detail={Platform.OS === 'web' ? (language === 'vi' ? 'Chỉ khả dụng trên ứng dụng native.' : 'Available on the native app only.') : (language === 'vi' ? 'Yêu cầu Face ID, Touch ID hoặc vân tay khi quay lại app.' : 'Require biometrics whenever you return to the app.')} trailing={<Switch value={biometric} disabled={Platform.OS === 'web'} onValueChange={(value) => void handleBiometric(value)} trackColor={{ true: ui.colors.accent }} />} />
      </ListGroup>

      <SectionHeader title={language === 'vi' ? 'Ngoại tuyến' : 'Offline'} />
      <View style={{ padding: 16, borderRadius: ui.radius.lg, backgroundColor: ui.colors.surface, borderWidth: 1, borderColor: ui.colors.border }}>
        <Text style={{ color: ui.colors.text, ...ui.typography.bodyStrong }}>{language === 'vi' ? 'Dữ liệu gần đây vẫn sẵn sàng khi mất mạng' : 'Recent data stays available offline'}</Text>
        <Text style={{ color: ui.colors.textMuted, ...ui.typography.body, marginTop: 5 }}>{language === 'vi' ? 'Projects, issues và inbox được lưu cục bộ trong 24 giờ và tự đồng bộ lại khi có mạng.' : 'Projects, issues and inbox are cached locally for 24 hours and refresh when connectivity returns.'}</Text>
      </View>
    </Screen>
  );
}
