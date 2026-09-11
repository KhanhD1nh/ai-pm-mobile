import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import { Modal, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotionPressable } from "./motion";
import type { AppTheme } from "./theme";

export type AppDialogTone = "info" | "success" | "warning" | "danger";

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

const toneIcon = {
  info: "information-circle-outline",
  success: "checkmark-outline",
  warning: "alert-outline",
  danger: "close-outline",
} as const;

export function AppDialog({
  visible,
  title,
  message,
  tone = "info",
  icon,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  onRequestClose,
  ui,
}: {
  visible: boolean;
  title: string;
  message?: string;
  tone?: AppDialogTone;
  icon?: IoniconsIconName;
  primaryAction: AppDialogAction;
  secondaryAction?: AppDialogAction;
  tertiaryAction?: AppDialogAction;
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
                name={icon ?? toneIcon[tone]}
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
                android_ripple={
                  Platform.OS === "android"
                    ? { color: "rgba(255,255,255,0.20)" }
                    : undefined
                }
                onPress={primaryAction.onPress}
                style={[
                  styles.primaryButton,
                  primaryAction.destructive && styles.primaryButtonDestructive,
                ]}
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
                  android_ripple={
                    Platform.OS === "android"
                      ? { color: ui.colors.accentSoft }
                      : undefined
                  }
                  onPress={secondaryAction.onPress}
                  style={[
                    styles.secondaryButton,
                    secondaryAction.destructive && styles.secondaryButtonDanger,
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      secondaryAction.destructive &&
                        styles.secondaryButtonTextDanger,
                    ]}
                  >
                    {secondaryAction.label}
                  </Text>
                </MotionPressable>
              ) : null}

              {tertiaryAction ? (
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={tertiaryAction.label}
                  disabled={tertiaryAction.disabled}
                  android_ripple={
                    Platform.OS === "android"
                      ? { color: ui.colors.accentSoft }
                      : undefined
                  }
                  onPress={tertiaryAction.onPress}
                  style={[
                    styles.secondaryButton,
                    tertiaryAction.destructive && styles.secondaryButtonDanger,
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      tertiaryAction.destructive &&
                        styles.secondaryButtonTextDanger,
                    ]}
                  >
                    {tertiaryAction.label}
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
      overflow: "hidden",
    },
    primaryButtonDestructive: { backgroundColor: ui.colors.danger },
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
      overflow: "hidden",
    },
    secondaryButtonDanger: { backgroundColor: ui.colors.dangerSoft },
    secondaryButtonText: {
      color: ui.colors.textSecondary,
      ...ui.typography.bodyStrong,
    },
    secondaryButtonTextDanger: { color: ui.colors.danger },
  });
