import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassSurface } from '@/shared/components/ui/glass';
import { MotionPressable } from '@/shared/components/ui/motion';
import {
  NAV_BAR_HEIGHT,
  NAV_BAR_PADDING,
  NAV_PAN_THRESHOLD,
  NAV_VERTICAL_TOLERANCE,
  navigationIndexAtX,
  navigationLensFrame,
  navigationMetrics,
  navigationOffsetAtX,
} from '@/shared/components/ui/navigation-geometry';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { useAuth } from '@/providers/auth-provider';

type NavKey = 'home' | 'projects' | 'create' | 'inbox' | 'more';
type NavItem = {
  key: Exclude<NavKey, 'create'>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href: '/home' | '/projects' | '/inbox' | '/more';
};

const SNAP_SPRING = {
  damping: 24,
  stiffness: 300,
  mass: 0.72,
  overshootClamping: true,
};

const PRESS_SPRING = {
  damping: 22,
  stiffness: 340,
  mass: 0.65,
  overshootClamping: true,
};

function activeKeyForPath(pathname: string): NavKey | null {
  if (pathname === '/home' || pathname === '/') return 'home';
  if (pathname === '/projects' || pathname.startsWith('/project/')) return 'projects';
  if (pathname === '/quick-create') return 'create';
  if (pathname === '/inbox') return 'inbox';
  if (pathname === '/more' || pathname.startsWith('/settings/') || pathname.startsWith('/agents')) return 'more';
  return null;
}

function selectionHaptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
}

function NavTabButton({
  item,
  active,
  engaged,
  ui,
  styles,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  engaged: boolean;
  ui: AppTheme;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  const activeProgress = useSharedValue(active ? 1 : 0);
  const engagedProgress = useSharedValue(engaged ? 1 : 0);

  useEffect(() => {
    activeProgress.set(withTiming(active ? 1 : 0, { duration: 130 }));
  }, [active, activeProgress]);

  useEffect(() => {
    engagedProgress.set(withSpring(engaged ? 1 : 0, PRESS_SPRING));
  }, [engaged, engagedProgress]);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + engagedProgress.get() * 0.04 }],
  }));
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: activeProgress.get() }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - activeProgress.get() }));

  return (
    <MotionPressable
      testID={`navigation-tab-${item.key}`}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View pointerEvents="none" style={[styles.iconStack, contentStyle]}>
        <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
          <Ionicons accessible={false} name={item.icon} size={24} color={ui.colors.textSecondary} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, activeIconStyle]}>
          <Ionicons accessible={false} name={item.activeIcon} size={24} color={ui.colors.accentStrong} />
        </Animated.View>
      </Animated.View>
    </MotionPressable>
  );
}

export function GlobalNavigationBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme: ui, resolvedTheme, language, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [barWidth, setBarWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const activeKey = activeKeyForPath(pathname);
  const items: NavItem[] = [
    { key: 'home', label: t('nav.home'), icon: 'home-outline', activeIcon: 'home', href: '/home' },
    { key: 'projects', label: t('nav.projects'), icon: 'folder-outline', activeIcon: 'folder', href: '/projects' },
    { key: 'inbox', label: t('nav.inbox'), icon: 'chatbox-outline', activeIcon: 'chatbox', href: '/inbox' },
    { key: 'more', label: t('nav.more'), icon: 'person-circle-outline', activeIcon: 'person-circle', href: '/more' },
  ];
  const itemCount = items.length;
  const activeIndex = items.findIndex((item) => item.key === activeKey);
  const createActive = activeKey === 'create';
  const { ready, slotWidth } = navigationMetrics(barWidth, itemCount);

  // Route position and drag position intentionally never write to each other.
  // This prevents a stale route spring from fighting direct manipulation.
  const routeX = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragActive = useSharedValue(0);
  const velocityStretch = useSharedValue(0);
  const gestureEngagement = useSharedValue(0);
  const gestureIndex = useSharedValue(-1);
  const panConsumedTouch = useSharedValue(false);
  const createProgress = useSharedValue(createActive ? 1 : 0);

  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => undefined);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const target = Math.max(0, activeIndex) * slotWidth;
    routeX.set(reduceMotion ? target : withSpring(target, SNAP_SPRING));
  }, [activeIndex, ready, reduceMotion, routeX, slotWidth]);

  useEffect(() => {
    createProgress.set(withTiming(createActive ? 1 : 0, { duration: reduceMotion ? 0 : 150 }));
  }, [createActive, createProgress, reduceMotion]);

  const indicatorStyle = useAnimatedStyle(() => {
    const offset = dragActive.get() > 0.5 ? dragX.get() : routeX.get();
    const frame = navigationLensFrame(
      offset,
      barWidth,
      itemCount,
      reduceMotion ? 0 : gestureEngagement.get(),
      reduceMotion ? 0 : velocityStretch.get(),
    );
    return {
      display: activeIndex >= 0 && frame.width > 0 ? 'flex' : 'none',
      width: frame.width,
      height: frame.height,
      top: frame.top,
      transform: [{ translateX: frame.left }],
    };
  }, [activeIndex, barWidth, itemCount, reduceMotion]);

  const createIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${createProgress.get() * 45}deg` }],
  }));

  const onBarLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - barWidth) > 0.5) setBarWidth(nextWidth);
  };

  const navigateToIndex = (index: number, haptic = true) => {
    const item = items[index];
    if (!item || item.key === activeKey) {
      setDragging(false);
      setPreviewIndex(activeIndex);
      return;
    }
    if (haptic) selectionHaptic();
    router.navigate(item.href);
  };

  const onDragStart = (index: number) => {
    setDragging(true);
    setPreviewIndex(index);
  };

  const onDragPreview = (index: number) => {
    setPreviewIndex((current) => {
      if (current === index) return current;
      selectionHaptic();
      return index;
    });
  };

  const onDragCommit = (index: number) => {
    setDragging(false);
    setPreviewIndex(index);
    navigateToIndex(index, false);
  };

  const onDragCancel = () => {
    setDragging(false);
    setPreviewIndex(activeIndex);
  };

  const scrubGesture = Gesture.Pan()
    .enabled(ready)
    .maxPointers(1)
    .activeOffsetX([-NAV_PAN_THRESHOLD, NAV_PAN_THRESHOLD])
    .failOffsetY([-NAV_VERTICAL_TOLERANCE, NAV_VERTICAL_TOLERANCE])
    .onTouchesDown(() => {
      'worklet';
      panConsumedTouch.set(false);
    })
    .onStart((event) => {
      'worklet';
      const index = navigationIndexAtX(event.x, barWidth, itemCount);
      if (index < 0) return;
      cancelAnimation(dragX);
      cancelAnimation(gestureEngagement);
      cancelAnimation(velocityStretch);
      dragActive.set(1);
      panConsumedTouch.set(true);
      gestureIndex.set(index);
      dragX.set(navigationOffsetAtX(event.x, barWidth, itemCount));
      gestureEngagement.set(reduceMotion ? 0 : withSpring(1, PRESS_SPRING));
      velocityStretch.set(0);
      runOnJS(selectionHaptic)();
      runOnJS(onDragStart)(index);
    })
    .onUpdate((event) => {
      'worklet';
      if (dragActive.get() < 0.5) return;
      const index = navigationIndexAtX(event.x, barWidth, itemCount);
      dragX.set(navigationOffsetAtX(event.x, barWidth, itemCount));
      velocityStretch.set(reduceMotion ? 0 : Math.min(1, Math.abs(event.velocityX) / 1700));
      if (gestureIndex.get() !== index) {
        gestureIndex.set(index);
        runOnJS(onDragPreview)(index);
      }
    })
    .onEnd((event, success) => {
      'worklet';
      if (!success || dragActive.get() < 0.5) return;
      const index = navigationIndexAtX(event.x, barWidth, itemCount);
      const target = index * slotWidth;
      gestureIndex.set(index);
      gestureEngagement.set(withSpring(0, PRESS_SPRING));
      velocityStretch.set(withTiming(0, { duration: reduceMotion ? 0 : 120 }));
      dragX.set(reduceMotion ? target : withSpring(target, SNAP_SPRING, (finished) => {
        if (finished) dragActive.set(0);
      }));
      if (reduceMotion) dragActive.set(0);
      runOnJS(onDragCommit)(index);
    })
    .onFinalize((_event, success) => {
      'worklet';
      if (success || dragActive.get() < 0.5) return;
      gestureEngagement.set(withSpring(0, PRESS_SPRING));
      velocityStretch.set(withTiming(0, { duration: reduceMotion ? 0 : 120 }));
      const routeTarget = routeX.get();
      dragX.set(reduceMotion ? routeTarget : withSpring(routeTarget, SNAP_SPRING, (finished) => {
        if (finished) dragActive.set(0);
      }));
      if (reduceMotion) dragActive.set(0);
      runOnJS(onDragCancel)();
    });

  const visualIndex = dragging && previewIndex >= 0 ? previewIndex : activeIndex;
  const visualKey = visualIndex >= 0 ? items[visualIndex]?.key : activeKey;

  if (!user || pathname === '/login') return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.navRow}>
        <GestureDetector gesture={scrubGesture}>
          {/* Measure and receive events on one fixed, untransformed host. */}
          <View collapsable={false} onLayout={onBarLayout} style={styles.barHost}>
            {/* Background and selection material are siblings, never a nested GlassContainer. */}
            <LiquidGlassSurface
              testID="navigation-background"
              pointerEvents="none"
              accessible={false}
              preset="floatingTabBar"
              colorScheme={resolvedTheme}
              style={styles.barBackground}
              fallbackStyle={styles.fallback}
            />

            <View collapsable={false} pointerEvents="none" style={styles.lensClip}>
              <Animated.View testID="navigation-selection" style={[styles.activeIndicator, indicatorStyle]}>
                <LiquidGlassSurface
                  pointerEvents="none"
                  accessible={false}
                  preset="floatingTabBar"
                  colorScheme={resolvedTheme}
                  style={styles.activeIndicatorGlass}
                  fallbackStyle={styles.activeIndicatorFallback}
                />
              </Animated.View>
            </View>

            {/* Symbols stay above both glass layers, so refraction never blurs the icons. */}
            <View collapsable={false} style={styles.items} accessibilityRole="tablist">
              {items.map((item, index) => (
                <NavTabButton
                  key={item.key}
                  item={item}
                  active={visualKey === item.key}
                  engaged={dragging && visualIndex === index}
                  ui={ui}
                  styles={styles}
                  onPress={() => {
                    if (!panConsumedTouch.get()) navigateToIndex(index);
                  }}
                />
              ))}
            </View>
          </View>
        </GestureDetector>

        <View style={styles.createHost}>
          <LiquidGlassSurface
            pointerEvents="none"
            accessible={false}
            preset="floatingTabBar"
            colorScheme={resolvedTheme}
            style={styles.createBackground}
            fallbackStyle={styles.fallback}
          />
          <MotionPressable
            testID="navigation-create"
            accessibilityRole="button"
            accessibilityLabel={language === 'vi' ? 'Tạo công việc' : 'Create task'}
            accessibilityState={{ selected: createActive }}
            onPress={() => {
              if (!createActive) {
                selectionHaptic();
                router.push('/quick-create');
              }
            }}
            style={styles.createHitArea}
          >
            <Animated.View pointerEvents="none" style={createIconStyle}>
              <Ionicons accessible={false} name="add" size={33} color={ui.colors.accentStrong} />
            </Animated.View>
          </MotionPressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  host: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 30,
    alignItems: 'center',
  },
  navRow: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barHost: {
    flex: 1,
    minWidth: 0,
    height: NAV_BAR_HEIGHT,
    borderRadius: NAV_BAR_HEIGHT / 2,
  },
  barBackground: {
    position: 'absolute',
    inset: 0,
    borderRadius: NAV_BAR_HEIGHT / 2,
    zIndex: 0,
    ...ui.shadow.floating,
  },
  fallback: {
    backgroundColor: ui.colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.colors.borderStrong,
  },
  lensClip: {
    position: 'absolute',
    inset: 0,
    borderRadius: NAV_BAR_HEIGHT / 2,
    overflow: 'hidden',
    zIndex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    borderRadius: 28,
  },
  activeIndicatorGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  activeIndicatorFallback: {
    backgroundColor: ui.colors.surfaceContainerHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.colors.borderStrong,
  },
  items: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: NAV_BAR_PADDING,
    zIndex: 2,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: NAV_BAR_HEIGHT - NAV_BAR_PADDING * 2,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStack: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createHost: {
    width: NAV_BAR_HEIGHT,
    height: NAV_BAR_HEIGHT,
    borderRadius: NAV_BAR_HEIGHT / 2,
  },
  createBackground: {
    position: 'absolute',
    inset: 0,
    borderRadius: NAV_BAR_HEIGHT / 2,
    ...ui.shadow.floating,
  },
  createHitArea: {
    width: NAV_BAR_HEIGHT,
    height: NAV_BAR_HEIGHT,
    borderRadius: NAV_BAR_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
