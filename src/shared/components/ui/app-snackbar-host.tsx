import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  dismissAppSnackbar,
  getAppSnackbarSnapshot,
  subscribeAppSnackbar,
  type AppSnackbarTone,
} from "@/shared/feedback/app-snackbar";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import type { AppTheme } from "./theme";

const toneIcon: Record<AppSnackbarTone, IoniconsIconName> = {
  neutral: "information-circle-outline",
  success: "checkmark-circle-outline",
  warning: "alert-circle-outline",
  danger: "close-circle-outline",
};

export function AppSnackbarHost() {
  const { theme: ui } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const snackbar = useSyncExternalStore(
    subscribeAppSnackbar,
    getAppSnackbarSnapshot,
    getAppSnackbarSnapshot,
  );
  const styles = useMemo(() => createStyles(ui), [ui]);

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(
      () => dismissAppSnackbar(snackbar.id),
      snackbar.durationMs,
    );
    return () => clearTimeout(timer);
  }, [snackbar]);

  if (!snackbar) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        entering={FadeInDown.duration(180).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutDown.duration(140).reduceMotion(ReduceMotion.System)}
        style={[
          styles.snackbar,
          {
            bottom:
              Math.max(insets.bottom, 12) +
              (Platform.OS === "android" ? 76 : 64),
          },
        ]}
      >
        <Ionicons
          accessible={false}
          name={toneIcon[snackbar.tone]}
          size={20}
          color={ui.colors.inverseText}
        />
        <Text style={styles.message}>{snackbar.message}</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    snackbar: {
      position: "absolute",
      left: 16,
      right: 16,
      maxWidth: 560,
      minHeight: 52,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: Platform.OS === "android" ? 16 : ui.radius.md,
      backgroundColor: ui.colors.text,
      ...ui.shadow.floating,
    },
    message: {
      flex: 1,
      color: ui.colors.inverseText,
      ...ui.typography.bodyStrong,
      fontWeight: "500",
    },
  });
