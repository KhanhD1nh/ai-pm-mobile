import { useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { MotionPressable } from "./motion";
import type { AppTheme } from "./theme";

function useStyles() {
  const { theme } = useAppPreferences();
  return useMemo(() => createStyles(theme), [theme]);
}

export function Pill({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
}) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.pill,
        tone === "accent" && styles.pillAccent,
        tone === "success" && styles.pillSuccess,
        tone === "warning" && styles.pillWarning,
        tone === "danger" && styles.pillDanger,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === "accent" && styles.pillTextAccent,
          tone === "success" && styles.pillTextSuccess,
          tone === "warning" && styles.pillTextWarning,
          tone === "danger" && styles.pillTextDanger,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function Field(props: TextInputProps) {
  const { theme } = useAppPreferences();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      selectionColor={theme.colors.accent}
      {...props}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[
        styles.field,
        focused && styles.fieldFocused,
        props.multiline && styles.multiline,
        props.style,
      ]}
    />
  );
}

export function Button({
  title,
  onPress,
  disabled,
  kind = "primary",
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "danger";
}) {
  const styles = useStyles();
  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        kind === "secondary" && styles.secondary,
        kind === "danger" && styles.danger,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          kind === "secondary" && styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </MotionPressable>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: ui.colors.surfaceRaised,
    },
    pillText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: "600",
    },
    pillAccent: { backgroundColor: ui.colors.accentSoft },
    pillSuccess: { backgroundColor: ui.colors.successSoft },
    pillWarning: { backgroundColor: ui.colors.warningSoft },
    pillDanger: { backgroundColor: ui.colors.dangerSoft },
    pillTextAccent: { color: ui.colors.accentStrong },
    pillTextSuccess: { color: ui.colors.success },
    pillTextWarning: { color: ui.colors.warning },
    pillTextDanger: { color: ui.colors.danger },
    field: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: ui.colors.border,
      borderRadius: ui.radius.md,
      paddingHorizontal: 14,
      color: ui.colors.text,
      backgroundColor: ui.colors.surface,
      ...ui.typography.body,
    },
    fieldFocused: {
      borderColor: ui.colors.accent,
      backgroundColor: ui.colors.bgElevated,
    },
    multiline: { minHeight: 112, paddingTop: 13, textAlignVertical: "top" },
    button: {
      minHeight: Platform.OS === "android" ? 52 : 48,
      borderRadius: Platform.OS === "android" ? 18 : 13,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      backgroundColor:
        Platform.OS === "android"
          ? ui.colors.primaryContainer
          : ui.colors.accentStrong,
      ...(Platform.OS === "android" ? { elevation: 0 } : ui.shadow.card),
    },
    secondary: {
      backgroundColor:
        Platform.OS === "android"
          ? ui.colors.surfaceContainerHigh
          : ui.colors.surface,
      borderWidth: Platform.OS === "android" ? 0 : 1,
      borderColor: ui.colors.borderStrong,
      shadowOpacity: 0,
      elevation: 0,
    },
    danger: { backgroundColor: ui.colors.danger },
    buttonText: {
      color:
        Platform.OS === "android"
          ? ui.colors.onPrimaryContainer
          : ui.colors.inverseText,
      ...ui.typography.bodyStrong,
      fontWeight: "600",
    },
    secondaryText: { color: ui.colors.text },
  });
