import Ionicons from "@react-native-vector-icons/ionicons";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AppTheme } from "./theme";

export type AppUpdateOverlayPhase = "downloading" | "restarting";

export function AppUpdateOverlay({
  visible,
  phase,
  progress,
  ui,
  vi,
}: {
  visible: boolean;
  phase: AppUpdateOverlayPhase;
  progress: number | null;
  ui: AppTheme;
  vi: boolean;
}) {
  const styles = createStyles(ui);
  const normalizedProgress =
    phase === "restarting"
      ? 1
      : progress == null
        ? null
        : Math.min(1, Math.max(0, progress));
  const percent =
    normalizedProgress == null ? null : Math.round(normalizedProgress * 100);
  const statusLabel =
    phase === "restarting"
      ? vi
        ? "Đã tải xong · đang khởi động lại"
        : "Download complete · restarting"
      : percent == null
        ? vi
          ? "Đang tải bản cập nhật…"
          : "Downloading update…"
        : vi
          ? `Đang tải bản cập nhật · ${percent}%`
          : `Downloading update · ${percent}%`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={Platform.OS === "android"}
      navigationBarTranslucent={Platform.OS === "android"}
      onRequestClose={() => {}}
    >
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View
          accessible
          accessibilityViewIsModal
          accessibilityRole="progressbar"
          accessibilityLabel={statusLabel}
          accessibilityValue={
            percent == null ? undefined : { min: 0, max: 100, now: percent }
          }
          style={styles.content}
        >
          <View style={styles.iconShell}>
            <Ionicons
              accessible={false}
              name={
                phase === "restarting"
                  ? "refresh-outline"
                  : "cloud-download-outline"
              }
              size={32}
              color={ui.colors.accentStrong}
            />
          </View>

          <Text style={styles.title}>
            {vi ? "Đang cập nhật AI-PM" : "Updating AI-PM"}
          </Text>
          <Text style={styles.status}>{statusLabel}</Text>

          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {phase === "restarting"
                  ? vi
                    ? "Chuẩn bị phiên bản mới"
                    : "Preparing the new version"
                  : vi
                    ? "Tải xuống"
                    : "Download"}
              </Text>
              <Text style={styles.progressValue}>
                {percent == null ? "…" : `${percent}%`}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              {normalizedProgress == null ? null : (
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(3, percent ?? 0)}%` },
                  ]}
                />
              )}
            </View>
          </View>

          <View style={styles.hintRow}>
            <ActivityIndicator size="small" color={ui.colors.accentStrong} />
            <Text style={styles.hint}>
              {phase === "restarting"
                ? vi
                  ? "AI-PM sẽ tự mở lại với phiên bản mới."
                  : "AI-PM will reopen automatically with the new version."
                : vi
                  ? "Vui lòng giữ ứng dụng mở trong khi cập nhật."
                  : "Please keep the app open while the update is installed."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ui.colors.bg,
      justifyContent: "center",
      paddingHorizontal: ui.spacing.xl,
    },
    content: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      alignItems: "center",
    },
    iconShell: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
      marginBottom: ui.spacing.lg,
    },
    title: {
      color: ui.colors.text,
      ...ui.typography.title,
      textAlign: "center",
    },
    status: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      textAlign: "center",
      marginTop: ui.spacing.xs,
    },
    progressBlock: {
      width: "100%",
      marginTop: ui.spacing.xl,
      gap: ui.spacing.sm,
    },
    progressHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: ui.spacing.md,
    },
    progressLabel: {
      flex: 1,
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
    },
    progressValue: {
      color: ui.colors.text,
      ...ui.typography.caption,
      fontVariant: ["tabular-nums"],
    },
    progressTrack: {
      height: 8,
      overflow: "hidden",
      borderRadius: ui.radius.round,
      backgroundColor: ui.colors.border,
    },
    progressFill: {
      height: "100%",
      borderRadius: ui.radius.round,
      backgroundColor: ui.colors.accentStrong,
    },
    hintRow: {
      width: "100%",
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: ui.spacing.sm,
      marginTop: ui.spacing.xl,
      paddingHorizontal: ui.spacing.md,
      paddingVertical: ui.spacing.sm,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    hint: {
      flexShrink: 1,
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      textAlign: "center",
    },
  });
