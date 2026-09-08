import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useMemo, type PropsWithChildren, type ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { HeaderBackButton } from "./mobile";
import { FadeInView, FocusTransitionView, MotionPressable } from "./motion";
import type { AppTheme } from "./theme";

type ScreenChrome = "root" | "stack" | "modal";

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  floating?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  chrome?: ScreenChrome;
  onBack?: () => void;
}>;

export function Screen({
  children,
  title,
  subtitle,
  right,
  floating,
  scroll = true,
  refreshing,
  onRefresh,
  edges = ["top"],
  chrome = "root",
  onBack,
}: ScreenProps) {
  const { theme } = useAppPreferences();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isStack = chrome === "stack" || chrome === "modal";
  // Native Stack already owns spatial transitions. Avoid layering a second
  // generic enter animation on top of it; this also honors Reduce Motion more
  // predictably and removes extra work on every detail-screen push.
  const content = (
    <FocusTransitionView
      style={[styles.content, !scroll && styles.contentFill]}
    >
      {children}
    </FocusTransitionView>
  );
  const showHeader = Boolean(title || subtitle || right || isStack);
  const handleBack = onBack ?? (() => router.back());

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {showHeader ? (
        isStack ? (
          <View style={styles.stackHeaderOuter}>
            <View style={styles.stackHeader}>
              <HeaderBackButton
                kind={chrome === "modal" ? "close" : "back"}
                onPress={handleBack}
              />

              <View style={styles.stackCopy}>
                {title ? (
                  <Text style={styles.stackTitle} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text style={styles.stackSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {right ? (
                <View style={styles.stackRight}>{right}</View>
              ) : (
                <View style={styles.stackSpacer} />
              )}
            </View>
          </View>
        ) : (
          <View style={styles.headerOuter}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>
              {right ? <View style={styles.headerRight}>{right}</View> : null}
            </View>
          </View>
        )
      ) : null}

      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentInsetAdjustmentBehavior={
            Platform.OS === "ios" ? "automatic" : "never"
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                tintColor={theme.colors.accent}
                colors={[theme.colors.accent]}
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {floating}
    </SafeAreaView>
  );
}

export function LoadingScreen({
  title,
  subtitle,
  chrome = "root",
}: { title?: string; subtitle?: string; chrome?: ScreenChrome } = {}) {
  const { theme } = useAppPreferences();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (title || chrome !== "root") {
    return (
      <Screen title={title} subtitle={subtitle} chrome={chrome} scroll={false}>
        <LoadingSkeleton styles={styles} />
      </Screen>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.loadingRoot}>
        <LoadingSkeleton styles={styles} />
      </View>
    </SafeAreaView>
  );
}

function LoadingSkeleton({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View accessibilityLabel="Loading" style={styles.skeleton}>
      <View style={styles.skeletonEyebrow} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
      <View style={styles.skeletonBlock} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRowShort} />
      <View style={styles.skeletonBlockSmall} />
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  const { theme } = useAppPreferences();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <FadeInView style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          accessible={false}
          name="file-tray-outline"
          size={22}
          color={theme.colors.textMuted}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </FadeInView>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
}) {
  const { theme, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View accessibilityRole="alert" style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          accessible={false}
          name="alert-circle-outline"
          size={22}
          color={theme.colors.danger}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {onRetry ? (
        <MotionPressable
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {language === "vi" ? "Thử lại" : "Try again"}
          </Text>
        </MotionPressable>
      ) : null}
    </View>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.colors.bg },
    center: { alignItems: "center", justifyContent: "center" },
    loadingRoot: {
      flex: 1,
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 18,
    },
    headerOuter: { paddingHorizontal: 16 },
    header: {
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerCopy: { flex: 1, minWidth: 0 },
    headerRight: { flexShrink: 0, paddingTop: 1 },
    title: { color: ui.colors.text, ...ui.typography.screenTitle },
    subtitle: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      marginTop: 3,
    },
    stackHeaderOuter: {
      width: "100%",
      zIndex: 20,
      paddingHorizontal: ui.header.horizontalInset,
      paddingVertical: ui.header.verticalInset,
    },
    stackHeader: {
      width: "100%",
      maxWidth: 820,
      minHeight: ui.header.actionSize,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
    },
    stackCopy: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      paddingHorizontal: 8,
    },
    stackTitle: {
      color: ui.colors.text,
      fontSize: 16.5,
      lineHeight: 21,
      fontWeight: "700",
      letterSpacing: -0.15,
    },
    stackSubtitle: {
      maxWidth: "100%",
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 11.5,
      lineHeight: 15,
      marginTop: 1,
    },
    stackRight: {
      minWidth: ui.header.actionSize,
      minHeight: ui.header.actionSize,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    stackSpacer: { width: ui.header.actionSize, height: ui.header.actionSize },
    // NativeTabs owns the tab-bar safe area on both platforms. Keep only a small
    // visual tail so the final row does not touch the navigation surface.
    scroll: { paddingBottom: 24 },
    content: {
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      paddingHorizontal: 16,
      gap: 16,
    },
    contentFill: { flex: 1, minHeight: 0 },
    skeleton: { width: "100%", minHeight: 360, gap: 12, paddingTop: 10 },
    skeletonEyebrow: {
      width: "28%",
      height: 12,
      borderRadius: 6,
      backgroundColor: ui.colors.surfaceRaised,
    },
    skeletonTitle: {
      width: "68%",
      height: 30,
      borderRadius: 10,
      backgroundColor: ui.colors.surfaceRaised,
    },
    skeletonSubtitle: {
      width: "86%",
      height: 16,
      borderRadius: 8,
      backgroundColor: ui.colors.surfaceRaised,
    },
    skeletonBlock: {
      height: 92,
      borderRadius: ui.radius.lg,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      marginTop: 6,
    },
    skeletonRow: {
      width: "100%",
      height: 58,
      borderRadius: 12,
      backgroundColor: ui.colors.surfaceRaised,
      marginTop: 4,
    },
    skeletonRowShort: {
      width: "78%",
      height: 16,
      borderRadius: 8,
      backgroundColor: ui.colors.surfaceRaised,
    },
    skeletonBlockSmall: {
      height: 70,
      borderRadius: ui.radius.lg,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      marginTop: 6,
    },
    empty: {
      paddingVertical: 52,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 9,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
      marginBottom: 3,
    },
    emptyTitle: { color: ui.colors.text, ...ui.typography.heading },
    emptyBody: {
      color: ui.colors.textMuted,
      ...ui.typography.body,
      textAlign: "center",
      maxWidth: 320,
    },
    retryButton: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: ui.radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
      marginTop: 4,
    },
    retryText: { color: ui.colors.accentStrong, ...ui.typography.bodyStrong },
  });
