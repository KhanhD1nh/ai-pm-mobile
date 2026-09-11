import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  Animated as RNAnimated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Reanimated, {
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import type { AppTheme } from "./theme";
import { MotionPressable } from "./motion";
import { LiquidGlassSurface } from "./glass";
import { Field } from "./primitives";

const sheetResizeTransition = LinearTransition.springify()
  .damping(30)
  .stiffness(220)
  .mass(0.85)
  .reduceMotion(ReduceMotion.System);

export function SectionHeader({
  title,
  caption,
  right,
}: {
  title: string;
  caption?: string;
  right?: ReactNode;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function GlassIconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
}: {
  icon: IoniconsIconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const { theme: ui, themePreference, resolvedTheme } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);

  if (Platform.OS === "android") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        hitSlop={4}
        android_ripple={{
          color: ui.colors.accentSoft,
          borderless: true,
          radius: ui.header.actionSize / 2,
        }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.androidIconButton,
          selected && styles.androidIconButtonSelected,
          pressed && styles.androidIconButtonPressed,
          disabled && styles.glassIconDisabledContent,
        ]}
      >
        <Ionicons
          accessible={false}
          name={icon}
          size={ui.header.iconSize}
          color={
            disabled
              ? ui.colors.textMuted
              : selected
                ? ui.colors.accentStrong
                : ui.colors.text
          }
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={styles.glassIconHit}
    >
      {({ pressed }) => (
        <LiquidGlassSurface
          variant="regular"
          interactive
          colorScheme={themePreference === "system" ? "auto" : resolvedTheme}
          style={styles.glassIconButton}
          fallbackStyle={styles.glassIconFallback}
        >
          {/* Fade the symbol only; fading a native glass ancestor can hide its material. */}
          <View
            pointerEvents="none"
            style={[
              pressed && styles.glassIconPressedContent,
              disabled && styles.glassIconDisabledContent,
            ]}
          >
            <Ionicons
              accessible={false}
              name={icon}
              size={ui.header.iconSize}
              color={
                disabled
                  ? ui.colors.textMuted
                  : selected
                    ? ui.colors.accentStrong
                    : ui.colors.text
              }
            />
          </View>
        </LiquidGlassSurface>
      )}
    </Pressable>
  );
}

/** Shared by stack headers, project headers and modal/sheet dismiss controls. */
export function HeaderBackButton({
  onPress,
  kind = "back",
  label,
}: {
  onPress: () => void;
  kind?: "back" | "close";
  label?: string;
}) {
  const { language } = useAppPreferences();
  const defaultLabel =
    kind === "close"
      ? language === "vi"
        ? "Đóng"
        : "Close"
      : language === "vi"
        ? "Quay lại"
        : "Back";

  return (
    <GlassIconButton
      icon={
        kind === "close"
          ? "close"
          : Platform.OS === "android"
            ? "arrow-back"
            : "chevron-back"
      }
      label={label ?? defaultLabel}
      onPress={onPress}
    />
  );
}

export function SearchBar({
  containerStyle,
  ...props
}: TextInputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View style={[styles.searchBar, containerStyle]}>
      <Ionicons
        accessible={false}
        name="search-outline"
        size={18}
        color={ui.colors.textMuted}
      />
      <Field {...props} style={[styles.searchBarField, props.style]} />
      {typeof props.value === "string" &&
      props.value.length > 0 &&
      props.onChangeText ? (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={
            language === "vi" ? "Xóa nội dung tìm kiếm" : "Clear search"
          }
          hitSlop={8}
          onPress={() => props.onChangeText?.("")}
          style={styles.searchClear}
        >
          <Ionicons
            accessible={false}
            name="close-circle"
            size={18}
            color={ui.colors.textMuted}
          />
        </MotionPressable>
      ) : null}
    </View>
  );
}

export function SegmentedControl({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string; icon?: IoniconsIconName }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);

  return (
    <View style={styles.segmented}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <MotionPressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {item.icon ? (
              <Ionicons
                accessible={false}
                name={item.icon}
                size={15}
                color={active ? ui.colors.text : ui.colors.textSecondary}
              />
            ) : null}
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {item.label}
            </Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

export function ContentTabs({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const reduceMotion = useReducedMotion();
  const [frames, setFrames] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  const rememberFrame = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setFrames((current) => {
      const previous = current[key];
      if (
        previous &&
        Math.abs(previous.x - x) < 0.5 &&
        Math.abs(previous.width - width) < 0.5
      )
        return current;
      return { ...current, [key]: { x, width } };
    });
  }, []);

  useEffect(() => {
    const frame = frames[value];
    if (!frame) return;

    if (reduceMotion) {
      indicatorX.value = frame.x;
      indicatorWidth.value = frame.width;
      indicatorOpacity.value = 1;
      return;
    }

    const timing = { duration: ui.motion.normal };
    indicatorX.value = withTiming(frame.x, timing);
    indicatorWidth.value = withTiming(frame.width, timing);
    indicatorOpacity.value = withTiming(1, { duration: ui.motion.fast });
  }, [
    frames,
    indicatorOpacity,
    indicatorWidth,
    indicatorX,
    reduceMotion,
    ui.motion.fast,
    ui.motion.normal,
    value,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={styles.contentTabs} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <MotionPressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            onLayout={(event) => rememberFrame(item.key, event)}
            style={styles.contentTab}
          >
            <View style={styles.contentTabLabel}>
              <Text
                style={[
                  styles.contentTabText,
                  active && styles.contentTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </View>
          </MotionPressable>
        );
      })}
      <Reanimated.View
        pointerEvents="none"
        style={[styles.contentTabIndicator, indicatorStyle]}
      />
    </View>
  );
}

export function ListGroup({
  children,
  style,
  variant = "grouped",
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: "grouped" | "plain";
}>) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View
      style={[styles.group, variant === "plain" && styles.groupPlain, style]}
    >
      {children}
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  detail,
  onPress,
  trailing,
  danger = false,
  first = false,
}: {
  icon?: IoniconsIconName;
  label: string;
  value?: string | null;
  detail?: string | null;
  onPress?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
  first?: boolean;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const content = (
    <>
      {icon ? (
        <View
          accessible={false}
          style={[styles.rowIcon, danger && styles.rowIconDanger]}
        >
          <Ionicons
            accessible={false}
            name={icon}
            size={Platform.OS === "android" ? 20 : 18}
            color={danger ? ui.colors.danger : ui.colors.accentStrong}
          />
        </View>
      ) : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
        {detail ? (
          <Text style={styles.rowDetail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing ??
        (onPress ? (
          <Ionicons
            accessible={false}
            name="chevron-forward"
            size={16}
            color={ui.colors.textMuted}
          />
        ) : null)}
    </>
  );
  if (!onPress)
    return (
      <View style={[styles.row, !first && styles.rowBorder]}>{content}</View>
    );
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={[label, detail, value].filter(Boolean).join(", ")}
      android_ripple={
        Platform.OS === "android"
          ? { color: ui.colors.surfaceContainerHigh }
          : undefined
      }
      onPress={onPress}
      style={[styles.row, !first && styles.rowBorder]}
    >
      {content}
    </MotionPressable>
  );
}

export function BottomSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
}>) {
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Keep the native Modal mounted long enough to animate an externally-driven
  // dismissal (for example after a successful assignee/status selection).
  // Binding Modal.visible directly to the parent `visible` prop makes the
  // native modal disappear before our exit animation can run.
  const [presented, setPresented] = useState(visible);
  // Keep one Animated.Value for the component lifetime. `windowHeight` may
  // change while the keyboard opens on Android; recreating the value there
  // would replay the sheet entrance while the user is typing.
  const dragY = useMemo(
    () => new RNAnimated.Value(Dimensions.get("window").height),
    [],
  );
  const scrimOpacity = useMemo(() => new RNAnimated.Value(0), []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const runCloseAnimation = useCallback(
    (afterClose: () => void) => {
      dragY.stopAnimation();
      scrimOpacity.stopAnimation();

      if (reduceMotion) {
        scrimOpacity.setValue(0);
        dragY.setValue(windowHeight);
        requestAnimationFrame(afterClose);
        return;
      }

      RNAnimated.parallel([
        RNAnimated.timing(scrimOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        RNAnimated.timing(dragY, {
          toValue: windowHeight,
          duration: 280,
          easing: Easing.bezier(0.4, 0, 0.7, 0.2),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        afterClose();
      });
    },
    [dragY, reduceMotion, scrimOpacity, windowHeight],
  );

  const requestClose = useCallback(() => {
    runCloseAnimation(() => {
      // React batches this local state update with the parent `onClose`
      // update, so there is no intermediate frame that can reopen the sheet.
      setPresented(false);
      onClose();
    });
  }, [onClose, runCloseAnimation]);

  useEffect(() => {
    dragY.stopAnimation();
    scrimOpacity.stopAnimation();

    if (!visible) {
      if (presented) {
        runCloseAnimation(() => setPresented(false));
      }
      return;
    }

    if (!presented) {
      const frame = requestAnimationFrame(() => setPresented(true));
      return () => cancelAnimationFrame(frame);
    }

    if (reduceMotion) {
      dragY.setValue(0);
      scrimOpacity.setValue(1);
      return;
    }

    // Use a slightly longer, non-bouncy spring for the sheet and a coordinated
    // scrim fade. This feels closer to the native iOS sheet cadence than moving
    // a full screen height with a short 240ms timing curve.
    dragY.setValue(windowHeight);
    scrimOpacity.setValue(0);
    RNAnimated.parallel([
      RNAnimated.timing(scrimOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.spring(dragY, {
        toValue: 0,
        damping: 30,
        stiffness: 220,
        mass: 0.9,
        overshootClamping: true,
        restDisplacementThreshold: 0.5,
        restSpeedThreshold: 0.5,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      dragY.stopAnimation();
      scrimOpacity.stopAnimation();
    };
  }, [
    dragY,
    presented,
    reduceMotion,
    runCloseAnimation,
    scrimOpacity,
    visible,
    windowHeight,
  ]);

  const restoreFromDrag = useCallback(() => {
    RNAnimated.parallel([
      RNAnimated.spring(dragY, {
        toValue: 0,
        damping: 24,
        stiffness: 280,
        mass: 0.8,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scrimOpacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [dragY, scrimOpacity]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // The whole top drag zone (grabber + title/subtitle) is an explicit dismiss
        // affordance. Claim touches immediately so the gesture stays attached to
        // the finger even when it starts away from the tiny visual handle.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragY.stopAnimation();
          dragY.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          const offset = Math.max(0, gesture.dy);
          dragY.setValue(offset);
          scrimOpacity.setValue(
            Math.max(0.45, 1 - offset / Math.max(windowHeight * 0.72, 1)),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          const isDownwardSwipe =
            gesture.dy > 0 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
          if (isDownwardSwipe && (gesture.dy > 44 || gesture.vy > 0.55)) {
            requestClose();
            return;
          }
          restoreFromDrag();
        },
        onPanResponderTerminate: () => {
          restoreFromDrag();
        },
      }),
    [dragY, requestClose, restoreFromDrag, scrimOpacity, windowHeight],
  );
  return (
    <Modal
      visible={presented}
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <RNAnimated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: ui.colors.overlay, opacity: scrimOpacity },
          ]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
        <KeyboardAvoidingView
          style={styles.keyboardFrame}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Reanimated.View
            layout={sheetResizeTransition}
            style={styles.sheetFrame}
          >
            <RNAnimated.View style={{ transform: [{ translateY: dragY }] }}>
              <View
                style={[
                  styles.sheet,
                  {
                    paddingBottom: keyboardVisible
                      ? 8
                      : Math.max(insets.bottom, 12),
                  },
                  Platform.OS === "android" && styles.sheetAndroid,
                ]}
              >
                <View
                  {...panResponder.panHandlers}
                  style={styles.sheetDragZone}
                >
                  <View
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={
                      language === "vi" ? "Đóng bảng" : "Dismiss sheet"
                    }
                    accessibilityHint={
                      language === "vi"
                        ? "Kéo xuống để đóng"
                        : "Swipe down to dismiss"
                    }
                    accessibilityActions={[
                      {
                        name: "activate",
                        label: language === "vi" ? "Đóng" : "Dismiss",
                      },
                    ]}
                    onAccessibilityAction={(event) => {
                      if (event.nativeEvent.actionName === "activate")
                        requestClose();
                    }}
                    style={styles.handleHitArea}
                  >
                    <View style={styles.handle} />
                  </View>
                  <View style={styles.sheetHeader}>
                    <View style={styles.sheetTitleCopy}>
                      <Text style={styles.sheetTitle}>{title}</Text>
                      {subtitle ? (
                        <Text style={styles.sheetSubtitle}>{subtitle}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={
                    Platform.OS === "ios" ? "interactive" : "on-drag"
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.sheetContent,
                    footer ? styles.sheetContentWithFooter : undefined,
                  ]}
                >
                  {children}
                </ScrollView>
                {footer ? (
                  <View style={styles.sheetFooter}>{footer}</View>
                ) : null}
              </View>
            </RNAnimated.View>
          </Reanimated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ChoiceRow({
  label,
  active,
  onPress,
  description,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  description?: string;
  disabled?: boolean;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={[label, description].filter(Boolean).join(", ")}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      android_ripple={
        Platform.OS === "android"
          ? { color: ui.colors.surfaceContainerHigh }
          : undefined
      }
      onPress={onPress}
      style={[
        styles.choice,
        active && styles.choiceActive,
        disabled && styles.choiceDisabled,
      ]}
    >
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.choiceDescription}>{description}</Text>
        ) : null}
      </View>
      <View
        accessible={false}
        style={[styles.radio, active && styles.radioActive]}
      >
        {active ? (
          <Ionicons
            accessible={false}
            name="checkmark"
            size={13}
            color={ui.colors.inverseText}
          />
        ) : null}
      </View>
    </MotionPressable>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    sectionHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 1,
      marginTop: 12,
    },
    sectionCopy: { flex: 1, minWidth: 0 },
    sectionTitle: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 18,
    },
    sectionCaption: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    glassIconHit: {
      width: ui.header.actionSize,
      height: ui.header.actionSize,
      borderRadius: ui.header.actionSize / 2,
      flexShrink: 0,
    },
    androidIconButton: {
      width: ui.header.actionSize,
      height: ui.header.actionSize,
      borderRadius: ui.header.actionSize / 2,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "transparent",
    },
    androidIconButtonSelected: {
      backgroundColor: ui.colors.accentSoft,
    },
    androidIconButtonPressed: { opacity: 0.86 },
    glassIconButton: {
      width: ui.header.actionSize,
      height: ui.header.actionSize,
      borderRadius: ui.header.actionSize / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    glassIconFallback: {
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    glassIconPressedContent: { opacity: 0.6 },
    glassIconDisabledContent: { opacity: 0.5 },
    searchBar: {
      minHeight: Platform.OS === "android" ? 56 : 48,
      flexDirection: "row",
      alignItems: "center",
      gap: Platform.OS === "android" ? 10 : 8,
      paddingLeft: Platform.OS === "android" ? 16 : 13,
      paddingRight: 8,
      borderRadius: Platform.OS === "android" ? ui.radius.round : 13,
      backgroundColor:
        Platform.OS === "android"
          ? ui.colors.surfaceContainerHigh
          : ui.colors.surfaceRaised,
    },
    searchBarField: {
      flex: 1,
      minHeight: Platform.OS === "android" ? 54 : 46,
      height: Platform.OS === "android" ? 54 : 46,
      borderWidth: 0,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    searchClear: {
      width: Platform.OS === "android" ? 40 : 32,
      height: Platform.OS === "android" ? 40 : 32,
      alignItems: "center",
      justifyContent: "center",
    },
    segmented: {
      flexDirection: "row",
      alignSelf: "stretch",
      gap: 3,
      padding: 3,
      borderRadius: 14,
      backgroundColor: ui.colors.surfaceRaised,
    },
    segment: {
      flex: 1,
      minHeight: 38,
      borderRadius: 11,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 5,
    },
    segmentActive: { backgroundColor: ui.colors.bgElevated, ...ui.shadow.card },
    segmentText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "500",
    },
    segmentTextActive: { color: ui.colors.text, fontWeight: "600" },
    contentTabs: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "stretch",
      gap: 22,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ui.colors.border,
      position: "relative",
    },
    contentTab: { minWidth: 56, minHeight: 46, justifyContent: "center" },
    contentTabLabel: {
      alignSelf: "flex-start",
      minHeight: 46,
      justifyContent: "center",
    },
    contentTabText: {
      color: ui.colors.textMuted,
      ...ui.typography.bodyStrong,
      fontSize: 14.5,
      fontWeight: "600",
    },
    contentTabTextActive: { color: ui.colors.text },
    contentTabIndicator: {
      position: "absolute",
      left: 0,
      bottom: -StyleSheet.hairlineWidth,
      height: 2,
      borderRadius: 1,
      backgroundColor: ui.colors.accentStrong,
    },
    group: {
      overflow: "hidden",
      borderRadius: Platform.OS === "android" ? ui.radius.xl : ui.radius.lg,
      backgroundColor: ui.colors.surface,
      borderWidth: Platform.OS === "android" ? 0 : StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    groupPlain: {
      borderRadius: 0,
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    row: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: Platform.OS === "android" ? 16 : 12,
      paddingHorizontal: Platform.OS === "android" ? 16 : 14,
      paddingVertical: Platform.OS === "android" ? 12 : 11,
      overflow: "hidden",
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    rowIcon: {
      width: Platform.OS === "android" ? 40 : 34,
      height: Platform.OS === "android" ? 40 : 34,
      borderRadius: Platform.OS === "android" ? 20 : 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
    },
    rowIconDanger: { backgroundColor: ui.colors.dangerSoft },
    rowCopy: { flex: 1, minWidth: 0 },
    rowLabel: {
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      ...(Platform.OS === "android"
        ? { fontSize: 16, lineHeight: 22, fontWeight: "500" as const }
        : null),
    },
    rowLabelDanger: { color: ui.colors.danger },
    rowDetail: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
      ...(Platform.OS === "android"
        ? { fontSize: 14, lineHeight: 20, fontWeight: "400" as const }
        : null),
    },
    rowValue: {
      maxWidth: "42%",
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      textAlign: "right",
    },
    backdrop: { flex: 1, justifyContent: "flex-end" },
    keyboardFrame: { flex: 1, justifyContent: "flex-end" },
    sheetFrame: { maxHeight: "88%", width: "100%" },
    sheet: {
      maxHeight: "100%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
      paddingBottom: 12,
      backgroundColor: ui.colors.bgElevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.borderStrong,
      ...ui.shadow.floating,
    },
    sheetAndroid: {
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      elevation: 18,
    },
    sheetDragZone: { minHeight: Platform.OS === "android" ? 94 : 88 },
    handleHitArea: {
      minHeight: Platform.OS === "android" ? 48 : 44,
      alignItems: "center",
      justifyContent: "center",
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: ui.colors.borderStrong,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 10,
    },
    sheetTitleCopy: { flex: 1, minWidth: 0 },
    sheetTitle: { color: ui.colors.text, ...ui.typography.title },
    sheetSubtitle: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 3,
    },
    sheetContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
    sheetContentWithFooter: { paddingBottom: 10 },
    sheetFooter: {
      paddingHorizontal: 16,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    choice: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: ui.radius.md,
      paddingHorizontal: 13,
      paddingVertical: 10,
      backgroundColor: ui.colors.surface,
      overflow: "hidden",
    },
    choiceActive: { backgroundColor: ui.colors.accentSoft },
    choiceDisabled: { opacity: 0.5 },
    choiceCopy: { flex: 1, minWidth: 0 },
    choiceLabel: { color: ui.colors.text, ...ui.typography.bodyStrong },
    choiceLabelActive: { color: ui.colors.accentStrong },
    choiceDescription: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: ui.colors.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: ui.colors.accentStrong,
      backgroundColor: ui.colors.accentStrong,
    },
  });
