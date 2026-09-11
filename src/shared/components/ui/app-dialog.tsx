import Ionicons from "@react-native-vector-icons/ionicons";
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotionPressable } from "./motion";
import type { AppTheme } from "./theme";

export type AppDialogTone = "info" | "success" | "warning" | "danger";

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const toneIcon = {
  info: "cloud-download-outline",
  success: "checkmark-outline",
  warning: "alert-outline",
  danger: "close-outline",
} as const;

export function AppDialog({
  visible,
  title,
  message,
  tone = "info",
  primaryAction,
  secondaryAction,
  onRequestClose,
  ui,
}: {
  visible: boolean;
  title: string;
  message?: string;
  tone?: AppDialogTone;
  primaryAction: AppDialogAction;
  secondaryAction?: AppDialogAction;
  onRequestClose: () => void;
  ui: AppTheme;
}) {
  const toneColors = getToneColors(ui, tone);
  const styles = createStyles(ui, toneColors.background);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === "android"}
      navigationBarTranslucent={Platform.OS === "android"}
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View accessibilityViewIsModal style={styles.card}>
            <View style={styles.iconShell}>
              <Ionicons
                accessible={false}
                name={toneIcon[tone]}
                size={34}
                color={toneColors.foreground}
              />
            </View>

            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.actions}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={primaryAction.label}
                disabled={primaryAction.disabled}
                onPress={primaryAction.onPress}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {primaryAction.label}
                </Text>
              </MotionPressable>

              {secondaryAction ? (
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={secondaryAction.label}
                  disabled={secondaryAction.disabled}
                  onPress={secondaryAction.onPress}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    {secondaryAction.label}
                  </Text>
                </MotionPressable>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getToneColors = (ui: AppTheme, tone: AppDialogTone) => ({
  foreground:
    tone === "success"
      ? ui.colors.success
      : tone === "warning"
        ? ui.colors.warning
        : tone === "danger"
          ? ui.colors.danger
          : ui.colors.accentStrong,
  background:
    tone === "success"
      ? ui.colors.successSoft
      : tone === "warning"
        ? ui.colors.warningSoft
        : tone === "danger"
          ? ui.colors.dangerSoft
          : ui.colors.accentSoft,
});

const createStyles = (ui: AppTheme, iconBackground: string) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: ui.colors.overlay,
    },
    safeArea: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Platform.OS === "ios" ? 20 : 24,
      paddingVertical: 24,
    },
    card: {
      width: "100%",
      maxWidth: Platform.OS === "ios" ? 360 : 400,
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 22,
      borderRadius: Platform.OS === "ios" ? ui.radius.xxl : 24,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      ...ui.shadow.floating,
    },
    iconShell: {
      width: 68,
      height: 68,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
      borderRadius: ui.radius.round,
      backgroundColor: iconBackground,
    },
    title: {
      color: ui.colors.text,
      textAlign: "center",
      ...ui.typography.title,
      fontSize: Platform.OS === "ios" ? 21 : 22,
      lineHeight: 28,
    },
    message: {
      maxWidth: 310,
      marginTop: 8,
      color: ui.colors.textSecondary,
      textAlign: "center",
      ...ui.typography.body,
      lineHeight: 21,
    },
    actions: {
      alignSelf: "stretch",
      gap: 10,
      marginTop: 24,
    },
    primaryButton: {
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: ui.radius.round,
      backgroundColor: ui.colors.accentStrong,
    },
    primaryButtonText: {
      color: ui.colors.inverseText,
      ...ui.typography.bodyStrong,
      fontSize: 16,
    },
    secondaryButton: {
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      borderRadius: ui.radius.round,
      backgroundColor: ui.colors.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    secondaryButtonText: {
      color: ui.colors.textSecondary,
      ...ui.typography.bodyStrong,
    },
  });
