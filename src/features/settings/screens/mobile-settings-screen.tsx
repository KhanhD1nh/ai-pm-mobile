import { showAppAlert } from "@/shared/feedback/app-alert";
import { useState } from "react";
import { ActivityIndicator, Platform, Switch, Text, View } from "react-native";
import { AppDialog } from "@/shared/components/ui/app-dialog";
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

type UpdateDialogKind = "available" | "up-to-date" | "unavailable";

export default function MobileSettingsScreen() {
  const { theme: ui, language } = useAppPreferences();
  const {
    devices,
    busy,
    pushEnabled,
    pushSupport,
    biometric,
    enablePush,
    disablePush,
    disableDevice,
    toggleBiometric,
    updateBusy,
    updateActivity,
    updateProgress,
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
  const [updateDialogKind, setUpdateDialogKind] =
    useState<UpdateDialogKind>("up-to-date");
  const [updateDialogVisible, setUpdateDialogVisible] = useState(false);
  const updateProgressPercent =
    updateProgress == null ? null : Math.round(updateProgress * 100);
  const updateActivityLabel =
    updateActivity === "downloading"
      ? language === "vi"
        ? updateProgressPercent == null
          ? "Đang tải bản cập nhật…"
          : `Đang tải bản cập nhật · ${updateProgressPercent}%`
        : updateProgressPercent == null
          ? "Downloading update…"
          : `Downloading update · ${updateProgressPercent}%`
      : updateActivity === "restarting"
        ? language === "vi"
          ? "Đã tải xong · đang khởi động lại…"
          : "Download complete · restarting…"
        : null;
  const otaUnavailableDetail =
    updateInfo.supportReason === "development-build"
      ? language === "vi"
        ? "Bản đang cài là development/Debug nên Expo Updates API bị tắt. Cài bản Release hỗ trợ OTA một lần để nhận các bản cập nhật sau."
        : "The installed app is a development/Debug build, so the Expo Updates API is disabled. Install an OTA-capable Release build once to receive later updates."
      : updateInfo.supportReason === "updates-disabled"
        ? language === "vi"
          ? "expo-updates chưa được bật đúng trong binary đang cài."
          : "expo-updates is not enabled in the installed binary."
        : language === "vi"
          ? "OTA chỉ khả dụng trên ứng dụng native."
          : "OTA is available only in the native app.";
  const pushUnavailableDetail =
    pushSupport.reason === "expo-go"
      ? language === "vi"
        ? "Remote push không khả dụng trong Expo Go."
        : "Remote push is unavailable in Expo Go."
      : pushSupport.reason === "web"
        ? language === "vi"
          ? "Push notifications chưa được hỗ trợ trên web."
          : "Push notifications are not supported on web."
        : null;

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
        setUpdateDialogKind("available");
      } else if (result.status === "up-to-date") {
        setUpdateDialogKind("up-to-date");
      } else {
        setUpdateDialogKind("unavailable");
      }
      setUpdateDialogVisible(true);
    } catch (error) {
      presentError(
        language === "vi"
          ? "Không thể kiểm tra cập nhật"
          : "Could not check for updates",
        error,
      );
    }
  };

  const handleApplyUpdate = () => {
    setUpdateDialogVisible(false);
    void applyUpdate().catch((error) =>
      presentError(
        language === "vi" ? "Không thể cập nhật" : "Update failed",
        error,
      ),
    );
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
          label={language === "vi" ? "Thông báo đẩy" : "Push notifications"}
          detail={
            pushUnavailableDetail ??
            (language === "vi"
              ? Platform.OS === "ios"
                ? "Nhận thông báo kể cả khi ứng dụng chạy nền hoặc đã đóng."
                : "Nhận thông báo khi ứng dụng chạy nền hoặc đã đóng."
              : Platform.OS === "ios"
                ? "Receive notifications even when the app is backgrounded or closed."
                : "Receive notifications while the app is backgrounded or closed.")
          }
          trailing={
            <Switch
              accessibilityLabel={
                language === "vi"
                  ? "Bật hoặc tắt thông báo đẩy"
                  : "Enable or disable push notifications"
              }
              value={pushEnabled}
              disabled={busy || devices.isLoading || !pushSupport.supported}
              onValueChange={(value) => void handlePushToggle(value)}
              trackColor={
                Platform.OS === "android"
                  ? {
                      false: ui.colors.borderStrong,
                      true: ui.colors.accent,
                    }
                  : undefined
              }
              thumbColor={
                Platform.OS === "android" ? ui.colors.surface : undefined
              }
            />
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
                        showAppAlert(
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
                showAppAlert(
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
                ? "Bản tích hợp sẵn trong ứng dụng"
                : "Bundled app version"
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
                ? "Tìm bản OTA mới mà không cần cài lại ứng dụng."
                : "Check for a new OTA without reinstalling the app."
              : otaUnavailableDetail
          }
          trailing={
            updateActivity === "checking" ? (
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={
                  language === "vi"
                    ? "Đang kiểm tra bản cập nhật"
                    : "Checking for updates"
                }
                style={{
                  width: 76,
                  minHeight: Platform.OS === "android" ? 52 : 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator
                  size="small"
                  color={ui.colors.accentStrong}
                />
              </View>
            ) : (
              <Button
                title={
                  updateActivity === "downloading" &&
                  updateProgressPercent != null
                    ? `${updateProgressPercent}%`
                    : language === "vi"
                      ? "Kiểm tra"
                      : "Check"
                }
                disabled={updateBusy || !updateInfo.supported}
                onPress={() => void handleCheckUpdate()}
              />
            )
          }
        />
      </ListGroup>
      {updateActivityLabel ? (
        <View
          style={{
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 13,
            borderRadius: ui.radius.lg,
            backgroundColor: ui.colors.surface,
            borderWidth: 1,
            borderColor: ui.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ActivityIndicator size="small" color={ui.colors.accentStrong} />
            <Text
              style={{
                flex: 1,
                color: ui.colors.text,
                ...ui.typography.bodyStrong,
              }}
            >
              {updateActivityLabel}
            </Text>
          </View>

          {updateActivity === "downloading" && updateProgressPercent != null ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={
                language === "vi"
                  ? "Tiến trình tải cập nhật"
                  : "Update download progress"
              }
              accessibilityValue={{
                min: 0,
                max: 100,
                now: updateProgressPercent,
              }}
              style={{
                height: 6,
                overflow: "hidden",
                borderRadius: 999,
                backgroundColor: ui.colors.border,
              }}
            >
              <View
                style={{
                  width: `${updateProgressPercent}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: ui.colors.accentStrong,
                }}
              />
            </View>
          ) : null}

          <Text
            style={{
              color: ui.colors.textMuted,
              ...ui.typography.caption,
            }}
          >
            {updateActivity === "downloading"
              ? language === "vi"
                ? "AI-PM sẽ tự khởi động lại khi tải xong."
                : "AI-PM will restart automatically when the download finishes."
              : language === "vi"
                ? "Bản cập nhật đã sẵn sàng để áp dụng."
                : "The update is ready to be applied."}
          </Text>
        </View>
      ) : null}

      <AppDialog
        visible={updateDialogVisible}
        icon={
          updateDialogKind === "available"
            ? "cloud-download-outline"
            : undefined
        }
        tone={
          updateDialogKind === "up-to-date"
            ? "success"
            : updateDialogKind === "unavailable"
              ? "warning"
              : "info"
        }
        title={
          updateDialogKind === "available"
            ? language === "vi"
              ? "Có bản cập nhật mới"
              : "Update available"
            : updateDialogKind === "up-to-date"
              ? language === "vi"
                ? "Đã là bản mới nhất"
                : "Up to date"
              : language === "vi"
                ? "OTA chưa khả dụng"
                : "OTA unavailable"
        }
        message={
          updateDialogKind === "available"
            ? language === "vi"
              ? "Bản OTA mới đã sẵn sàng."
              : "A new OTA update is ready."
            : updateDialogKind === "up-to-date"
              ? language === "vi"
                ? "Bạn đang dùng phiên bản mới nhất của AI-PM."
                : "You're using the latest version of AI-PM."
              : otaUnavailableDetail
        }
        primaryAction={{
          label:
            updateDialogKind === "available"
              ? language === "vi"
                ? "Cập nhật ngay"
                : "Update now"
              : "OK",
          onPress:
            updateDialogKind === "available"
              ? handleApplyUpdate
              : () => setUpdateDialogVisible(false),
        }}
        secondaryAction={
          updateDialogKind === "available"
            ? {
                label: language === "vi" ? "Để sau" : "Later",
                onPress: () => setUpdateDialogVisible(false),
              }
            : undefined
        }
        onRequestClose={() => setUpdateDialogVisible(false)}
        ui={ui}
      />
    </Screen>
  );
}
