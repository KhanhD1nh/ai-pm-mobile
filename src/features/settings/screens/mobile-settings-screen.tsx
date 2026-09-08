import { Alert, Platform, Switch, Text, View } from "react-native";
import { Button } from "@/shared/components/ui/primitives";
import {
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { Screen } from "@/shared/components/ui/screen";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useMobileSettings } from "../hooks/use-mobile-settings";

export default function MobileSettingsScreen() {
  const { theme: ui, language } = useAppPreferences();
  const {
    devices,
    busy,
    pushEnabled,
    biometric,
    enablePush,
    disablePush,
    disableDevice,
    toggleBiometric,
    updateBusy,
    updateStatus,
    updateInfo,
    checkUpdate,
    applyUpdate,
    offlineQueue,
    syncOfflineQueue,
    retryOfflineQueue,
    clearOfflineQueue,
  } = useMobileSettings();
  const pullRefresh = usePullToRefresh(() => devices.refetch());
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const otaUnavailableDetail =
    updateInfo.supportReason === "development-build"
      ? language === "vi"
        ? "Bản đang cài là development/Debug nên Expo Updates API bị tắt. Cài IPA Release OTA một lần để nhận các bản cập nhật sau."
        : "The installed app is a development/Debug build, so the Expo Updates API is disabled. Install the OTA-capable Release IPA once to receive later updates."
      : updateInfo.supportReason === "updates-disabled"
        ? language === "vi"
          ? "expo-updates chưa được bật đúng trong binary đang cài."
          : "expo-updates is not enabled in the installed binary."
        : language === "vi"
          ? "OTA chỉ khả dụng trên ứng dụng native."
          : "OTA is available only in the native app.";

  const handleEnablePush = async () => {
    try {
      await enablePush();
      Alert.alert(
        language === "vi"
          ? "Đã bật thông báo đẩy"
          : "Push notifications enabled",
      );
    } catch (error) {
      presentError(
        language === "vi" ? "Không thể bật push" : "Could not enable push",
        error,
      );
    }
  };

  const handlePushToggle = async (next: boolean) => {
    try {
      if (next) await enablePush();
      else await disablePush();
    } catch (error) {
      presentError(
        language === "vi"
          ? next
            ? "Không thể bật push"
            : "Không thể tắt push"
          : next
            ? "Could not enable push"
            : "Could not disable push",
        error,
      );
    }
  };

  const handleBiometric = async (next: boolean) => {
    try {
      await toggleBiometric(next);
    } catch (error) {
      presentError(
        language === "vi"
          ? "Không thể thay đổi App Lock"
          : "Could not change App Lock",
        error,
      );
    }
  };

  const handleCheckUpdate = async () => {
    try {
      const result = await checkUpdate();
      if (result.status === "available") {
        Alert.alert(
          language === "vi" ? "Có bản cập nhật mới" : "Update available",
          language === "vi"
            ? "Bản OTA mới đã sẵn sàng."
            : "A new OTA update is ready.",
          [
            { text: language === "vi" ? "Để sau" : "Later", style: "cancel" },
            {
              text: language === "vi" ? "Cập nhật ngay" : "Update now",
              onPress: () =>
                void applyUpdate().catch((error) =>
                  presentError(
                    language === "vi" ? "Không thể cập nhật" : "Update failed",
                    error,
                  ),
                ),
            },
          ],
        );
      } else if (result.status === "up-to-date") {
        Alert.alert(language === "vi" ? "Đã là bản mới nhất" : "Up to date");
      } else {
        Alert.alert(
          language === "vi" ? "OTA chưa khả dụng" : "OTA unavailable",
          otaUnavailableDetail,
        );
      }
    } catch (error) {
      presentError(
        language === "vi"
          ? "Không thể kiểm tra cập nhật"
          : "Could not check for updates",
        error,
      );
    }
  };

  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Cài đặt thiết bị" : "Device settings"}
      subtitle={
        Platform.OS === "ios"
          ? "iOS"
          : Platform.OS === "web"
            ? "Web"
            : "Android"
      }
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <SectionHeader
        title={language === "vi" ? "Thông báo" : "Notifications"}
        caption={
          language === "vi"
            ? "Cách AI-PM liên hệ với bạn"
            : "How AI-PM reaches you"
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="notifications-outline"
          label={
            language === "vi" ? "Push notifications" : "Push notifications"
          }
          detail={
            language === "vi"
              ? "Nhận thông báo khi app đang nền hoặc đã đóng."
              : "Receive alerts while the app is backgrounded or closed."
          }
          trailing={
            Platform.OS === "ios" ? (
              <Switch
                accessibilityLabel={
                  language === "vi"
                    ? "Bật hoặc tắt thông báo đẩy"
                    : "Enable or disable push notifications"
                }
                value={pushEnabled}
                disabled={busy || devices.isLoading}
                onValueChange={(value) => void handlePushToggle(value)}
              />
            ) : (
              <Button
                title={busy ? "…" : language === "vi" ? "Bật" : "Enable"}
                disabled={busy || Platform.OS === "web"}
                onPress={() => void handleEnablePush()}
              />
            )
          }
        />
      </ListGroup>

      {(devices.data ?? []).length > 0 ? (
        <>
          <SectionHeader
            title={
              language === "vi" ? "Thiết bị đã đăng ký" : "Registered devices"
            }
          />
          <ListGroup>
            {(devices.data ?? []).map((device, index) => (
              <ListRow
                key={device.id}
                first={index === 0}
                icon="phone-portrait-outline"
                label={device.device_name ?? device.platform}
                detail={`${device.push_provider} · ${language === "vi" ? "Lần cuối" : "Last seen"} ${new Date(device.last_seen_at).toLocaleString(locale)}`}
                value={device.enabled ? "ON" : "OFF"}
                onPress={
                  device.enabled
                    ? () =>
                        Alert.alert(
                          language === "vi"
                            ? "Tắt thông báo trên thiết bị này?"
                            : "Disable notifications on this device?",
                          undefined,
                          [
                            { text: language === "vi" ? "Hủy" : "Cancel" },
                            {
                              text: language === "vi" ? "Tắt" : "Disable",
                              style: "destructive",
                              onPress: () =>
                                void disableDevice(device.id).catch((error) =>
                                  presentError(
                                    language === "vi"
                                      ? "Không thể tắt thiết bị"
                                      : "Could not disable device",
                                    error,
                                  ),
                                ),
                            },
                          ],
                        )
                    : undefined
                }
              />
            ))}
          </ListGroup>
        </>
      ) : null}

      <SectionHeader title={language === "vi" ? "Bảo mật" : "Security"} />
      <ListGroup>
        <ListRow
          first
          icon="finger-print-outline"
          label={
            language === "vi" ? "Khóa sinh trắc học" : "Biometric App Lock"
          }
          detail={
            Platform.OS === "web"
              ? language === "vi"
                ? "Chỉ khả dụng trên ứng dụng native."
                : "Available on the native app only."
              : language === "vi"
                ? "Yêu cầu Face ID, Touch ID hoặc vân tay khi quay lại app."
                : "Require biometrics whenever you return to the app."
          }
          trailing={
            <Switch
              value={biometric}
              disabled={Platform.OS === "web"}
              onValueChange={(value) => void handleBiometric(value)}
              trackColor={{ true: ui.colors.accent }}
            />
          }
        />
      </ListGroup>

      <SectionHeader title={language === "vi" ? "Ngoại tuyến" : "Offline"} />
      <View
        style={{
          padding: 16,
          borderRadius: ui.radius.lg,
          backgroundColor: ui.colors.surface,
          borderWidth: 1,
          borderColor: ui.colors.border,
        }}
      >
        <Text style={{ color: ui.colors.text, ...ui.typography.bodyStrong }}>
          {language === "vi"
            ? "Dữ liệu gần đây vẫn sẵn sàng khi mất mạng"
            : "Recent data stays available offline"}
        </Text>
        <Text
          style={{
            color: ui.colors.textMuted,
            ...ui.typography.body,
            marginTop: 5,
          }}
        >
          {language === "vi"
            ? "Projects và issues gần đây được lưu cục bộ trong 12 giờ. Các thao tác tạo/sửa an toàn sẽ xếp hàng và tự gửi lại khi có mạng."
            : "Recent projects and issues are cached locally for 12 hours. Safe create/update actions queue and replay when connectivity returns."}
        </Text>
        <Text
          style={{
            color:
              offlineQueue.conflicts > 0 || offlineQueue.failed > 0
                ? ui.colors.warning
                : ui.colors.textSecondary,
            ...ui.typography.caption,
            marginTop: 10,
          }}
        >
          {language === "vi"
            ? `${offlineQueue.total} thao tác chờ · ${offlineQueue.conflicts} xung đột · ${offlineQueue.failed} lỗi`
            : `${offlineQueue.total} pending · ${offlineQueue.conflicts} conflicts · ${offlineQueue.failed} failed`}
        </Text>
        {offlineQueue.total > 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Button
              title={language === "vi" ? "Đồng bộ ngay" : "Sync now"}
              onPress={() =>
                void syncOfflineQueue().catch((error) =>
                  presentError(
                    language === "vi" ? "Không thể đồng bộ" : "Could not sync",
                    error,
                  ),
                )
              }
            />
            {offlineQueue.failed > 0 ? (
              <Button
                title={language === "vi" ? "Thử lại lỗi" : "Retry failed"}
                onPress={() =>
                  void retryOfflineQueue().catch((error) =>
                    presentError(
                      language === "vi"
                        ? "Không thể thử lại"
                        : "Could not retry",
                      error,
                    ),
                  )
                }
              />
            ) : null}
            <Button
              title={language === "vi" ? "Xóa hàng đợi" : "Clear queue"}
              onPress={() =>
                Alert.alert(
                  language === "vi"
                    ? "Xóa các thay đổi chưa đồng bộ?"
                    : "Clear unsynced changes?",
                  undefined,
                  [
                    {
                      text: language === "vi" ? "Hủy" : "Cancel",
                      style: "cancel",
                    },
                    {
                      text: language === "vi" ? "Xóa" : "Clear",
                      style: "destructive",
                      onPress: () => void clearOfflineQueue(),
                    },
                  ],
                )
              }
            />
          </View>
        ) : null}
      </View>

      <SectionHeader
        title={language === "vi" ? "Cập nhật ứng dụng" : "App updates"}
        caption={
          language === "vi"
            ? "OTA nội bộ qua EAS Update"
            : "Internal OTA via EAS Update"
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="cloud-download-outline"
          label={`AI-PM ${updateInfo.appVersion}`}
          detail={`${language === "vi" ? "Kênh" : "Channel"} ${updateInfo.channel} · runtime ${updateInfo.runtimeVersion}`}
          value={
            updateStatus === "available"
              ? language === "vi"
                ? "MỚI"
                : "NEW"
              : undefined
          }
        />
        <ListRow
          icon="git-commit-outline"
          label={language === "vi" ? "OTA hiện tại" : "Current OTA"}
          detail={
            updateInfo.updateId
              ? `${updateInfo.updateId.slice(0, 12)}${updateInfo.createdAt ? ` · ${new Date(updateInfo.createdAt).toLocaleString(locale)}` : ""}`
              : language === "vi"
                ? "Bản nhúng trong IPA"
                : "Embedded in IPA"
          }
        />
        {updateInfo.releaseNotes ? (
          <ListRow
            icon="document-text-outline"
            label={language === "vi" ? "Ghi chú phát hành" : "Release notes"}
            detail={updateInfo.releaseNotes}
          />
        ) : null}
        <ListRow
          icon="refresh-outline"
          label={language === "vi" ? "Kiểm tra cập nhật" : "Check for updates"}
          detail={
            updateInfo.supported
              ? language === "vi"
                ? "Tìm OTA mới mà không cần cài lại IPA."
                : "Find a new OTA without reinstalling the IPA."
              : otaUnavailableDetail
          }
          trailing={
            <Button
              title={
                updateBusy ? "…" : language === "vi" ? "Kiểm tra" : "Check"
              }
              disabled={updateBusy || !updateInfo.supported}
              onPress={() => void handleCheckUpdate()}
            />
          }
        />
      </ListGroup>
    </Screen>
  );
}
