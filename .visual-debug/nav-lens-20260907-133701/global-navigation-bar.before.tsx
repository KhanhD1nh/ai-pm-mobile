import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassGroup, LiquidGlassSurface } from '@/shared/components/ui/glass';
import { MotionPressable } from '@/shared/components/ui/motion';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { useAuth } from '@/providers/auth-provider';

type NavKey = 'home' | 'projects' | 'create' | 'inbox' | 'more';

type NavItem = {
  key: NavKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href?: '/home' | '/projects' | '/inbox' | '/more';
};

const TAB_SPRING = {
  damping: 20,
  stiffness: 240,
  mass: 0.72,
};

const HOLD_SPRING = {
  damping: 15,
  stiffness: 300,
  mass: 0.62,
};

const RELEASE_SPRING = {
  damping: 17,
  stiffness: 310,
  mass: 0.68,
};

function activeKeyForPath(pathname: string): NavKey | null {
  if (pathname === '/home' || pathname === '/') return 'home';
  if (pathname === '/projects' || pathname.startsWith('/project/')) return 'projects';
  if (pathname === '/quick-create') return 'create';
  if (pathname === '/inbox') return 'inbox';
  if (pathname === '/more' || pathname.startsWith('/settings/') || pathname.startsWith('/agents')) return 'more';
  return null;
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
  const progress = useSharedValue(active ? 1 : 0);
  const engageProgress = useSharedValue(engaged ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, TAB_SPRING);
  }, [active, progress]);

  useEffect(() => {
    engageProgress.value = withSpring(engaged ? 1 : 0, HOLD_SPRING);
  }, [engaged, engageProgress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: 0.76 + progress.value * 0.24,
    transform: [
      { translateY: -1.5 * progress.value - 2.2 * engageProgress.value },
      { scale: 0.94 + progress.value * 0.06 + engageProgress.value * 0.075 },
    ],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.8 + progress.value * 0.2 + engageProgress.value * 0.08 }],
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: 1 - progress.value * 0.08 }],
  }));

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View style={[styles.itemContent, contentStyle]}>
        <View style={styles.iconStack}>
          <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
            <Ionicons name={item.icon} size={24} color={ui.colors.textMuted} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, activeIconStyle]}>
            <Ionicons name={item.activeIcon} size={24} color={ui.colors.accentStrong} />
          </Animated.View>
        </View>
      </Animated.View>
    </MotionPressable>
  );
}

export function GlobalNavigationBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme: ui, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [barWidth, setBarWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(-1);

  const activeKey = activeKeyForPath(pathname);
  const items: NavItem[] = [
    { key: 'home', label: t('nav.home'), icon: 'home-outline', activeIcon: 'home', href: '/home' },
    { key: 'projects', label: t('nav.projects'), icon: 'folder-outline', activeIcon: 'folder', href: '/projects' },
    { key: 'create', label: '', icon: 'add', activeIcon: 'add' },
    { key: 'inbox', label: t('nav.inbox'), icon: 'chatbox-outline', activeIcon: 'chatbox', href: '/inbox' },
    { key: 'more', label: t('nav.more'), icon: 'person-circle-outline', activeIcon: 'person-circle', href: '/more' },
  ];
  const mainItems = items.filter((item) => item.key !== 'create');
  const createItem = items.find((item) => item.key === 'create')!;
  const createActive = activeKey === 'create';
  const activeIndex = mainItems.findIndex((item) => item.key === activeKey);
  const itemWidth = barWidth > 0 ? (barWidth - 10) / mainItems.length : 0;

  const routeX = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragActive = useSharedValue(0);
  const holdProgress = useSharedValue(0);
  const velocityStretch = useSharedValue(0);
  const velocityDirection = useSharedValue(0);
  const gestureIndex = useSharedValue(-1);
  const createProgress = useSharedValue(createActive ? 1 : 0);

  useEffect(() => {
    if (activeIndex >= 0 && itemWidth > 0) {
      routeX.value = withSpring(activeIndex * itemWidth, TAB_SPRING);
    }
  }, [activeIndex, itemWidth, routeX]);

  useEffect(() => {
    createProgress.value = withSpring(createActive ? 1 : 0, TAB_SPRING);
  }, [createActive, createProgress]);

  const indicatorStyle = useAnimatedStyle(() => {
    const stretch = velocityStretch.value;
    const hold = holdProgress.value;
    const direction = velocityDirection.value;
    const x = dragActive.value > 0.5 ? dragX.value : routeX.value;

    return {
      width: itemWidth,
      transform: [
        { translateX: x + direction * stretch * 3.2 },
        { translateY: -5.5 * hold },
        { scaleX: 1 + hold * 0.105 + stretch * 0.115 },
        { scaleY: 1 + hold * 0.085 - stretch * 0.035 },
        { rotateZ: `${direction * stretch * 1.35}deg` },
      ],
    };
  });

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value * 0.52 + velocityStretch.value * 0.18,
    transform: [
      { translateX: velocityDirection.value * velocityStretch.value * 7 },
      { scaleX: 1 + velocityStretch.value * 0.18 },
    ],
  }));

  const barDragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -1.5 * holdProgress.value },
      { scale: 1 + holdProgress.value * 0.012 },
    ],
  }));

  const createAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + createProgress.value * 0.035 },
      { rotate: `${createProgress.value * 45}deg` },
    ],
  }));

  const onBarLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - barWidth) > 0.5) setBarWidth(nextWidth);
  };

  if (!user || pathname === '/login') return null;

  const navigate = (item: NavItem, haptic = true) => {
    if (item.key === activeKey) return;

    if (haptic && Platform.OS !== 'web') {
      void Haptics.selectionAsync().catch(() => undefined);
    }

    if (item.key === 'create') {
      if (pathname !== '/quick-create') router.push('/quick-create' as never);
      return;
    }
    if (item.href) router.navigate(item.href as never);
  };

  const onDragStart = (index: number) => {
    setDragging(true);
    setPreviewIndex(index);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  };

  const onDragPreview = (index: number) => {
    setPreviewIndex((current) => {
      if (current === index) return current;
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync().catch(() => undefined);
      }
      return index;
    });
  };

  const onDragCommit = (index: number) => {
    setDragging(false);
    setPreviewIndex(index);
    const target = mainItems[index];
    if (target) navigate(target, false);
  };

  const onDragCancel = () => {
    setDragging(false);
    setPreviewIndex(activeIndex);
  };

  const maxDragX = Math.max(0, (mainItems.length - 1) * itemWidth);

  const scrubGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-16, 16])
    .onStart((event) => {
      if (itemWidth <= 0) return;

      const rawIndex = Math.floor((event.x - 5) / itemWidth);
      const index = Math.max(0, Math.min(mainItems.length - 1, rawIndex));
      const x = Math.max(0, Math.min(maxDragX, event.x - 5 - itemWidth / 2));

      gestureIndex.value = index;
      dragX.value = x;
      dragActive.value = 1;
      velocityStretch.value = 0;
      velocityDirection.value = 0;
      holdProgress.value = withSpring(1, HOLD_SPRING);

      runOnJS(onDragStart)(index);
    })
    .onUpdate((event) => {
      if (itemWidth <= 0) return;

      const x = Math.max(0, Math.min(maxDragX, event.x - 5 - itemWidth / 2));
      const rawIndex = Math.floor((event.x - 5) / itemWidth);
      const index = Math.max(0, Math.min(mainItems.length - 1, rawIndex));
      const stretch = Math.min(1, Math.abs(event.velocityX) / 1700);
      const direction = event.velocityX === 0 ? velocityDirection.value : event.velocityX > 0 ? 1 : -1;

      dragX.value = x;
      velocityStretch.value = stretch;
      velocityDirection.value = direction;

      if (gestureIndex.value !== index) {
        gestureIndex.value = index;
        runOnJS(onDragPreview)(index);
      }
    })
    .onEnd((event) => {
      if (itemWidth <= 0) return;

      const rawIndex = Math.floor((event.x - 5) / itemWidth);
      const index = Math.max(0, Math.min(mainItems.length - 1, rawIndex));
      const targetX = index * itemWidth;

      velocityStretch.value = withSpring(0, RELEASE_SPRING);
      velocityDirection.value = withTiming(0, { duration: 150 });
      holdProgress.value = withSpring(0, RELEASE_SPRING);
      dragX.value = withSpring(targetX, RELEASE_SPRING, (finished) => {
        if (finished) dragActive.value = 0;
      });

      runOnJS(onDragCommit)(index);
    })
    .onFinalize((_event, success) => {
      if (success) return;

      velocityStretch.value = withSpring(0, RELEASE_SPRING);
      velocityDirection.value = withTiming(0, { duration: 150 });
      holdProgress.value = withSpring(0, RELEASE_SPRING);
      dragX.value = withSpring(routeX.value, RELEASE_SPRING, (finished) => {
        if (finished) dragActive.value = 0;
      });
      runOnJS(onDragCancel)();
    });

  const visualIndex = dragging && previewIndex >= 0 ? previewIndex : activeIndex;
  const visualKey = visualIndex >= 0 ? mainItems[visualIndex]?.key : activeKey;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 10) }]}>
      <LiquidGlassGroup spacing={12} style={styles.navRow}>
        <GestureDetector gesture={scrubGesture}>
          <Animated.View style={[styles.barGestureHost, barDragStyle]}>
            <LiquidGlassSurface
              preset="floatingTabBar"
              style={styles.bar}
              fallbackStyle={styles.fallback}
              tintColor={Platform.OS === 'ios' ? undefined : ui.colors.surfaceContainer}
              onLayout={onBarLayout}
            >
              {itemWidth > 0 && activeIndex >= 0 ? (
                <Animated.View pointerEvents="none" style={[styles.activeIndicator, indicatorStyle]}>
                  <LiquidGlassSurface
                    preset="compactControl"
                    variant="clear"
                    style={styles.activeIndicatorGlass}
                    fallbackStyle={styles.activeIndicatorFallback}
                    tintColor={Platform.OS === 'ios' ? undefined : ui.colors.surfaceContainerHigh}
                  >
                    {Platform.OS === 'ios' ? null : <Animated.View style={[styles.dragSheen, sheenStyle]} />}
                  </LiquidGlassSurface>
                </Animated.View>
              ) : null}

              {mainItems.map((item, index) => (
                <NavTabButton
                  key={item.key}
                  item={item}
                  active={visualKey === item.key}
                  engaged={dragging && visualIndex === index}
                  ui={ui}
                  styles={styles}
                  onPress={() => navigate(item)}
                />
              ))}
            </LiquidGlassSurface>
          </Animated.View>
        </GestureDetector>

        <MotionPressable
          accessibilityRole="button"
          accessibilityState={{ selected: createActive }}
          accessibilityLabel="Create"
          onPress={() => navigate(createItem)}
          style={styles.createHitArea}
        >
          <Animated.View style={createAnimatedStyle}>
            <LiquidGlassSurface
              preset="floatingTabBar"
              interactive
              style={[styles.createButton, createActive && styles.createButtonActive]}
              fallbackStyle={[styles.fallback, createActive && styles.createFallbackActive]}
              tintColor={Platform.OS === 'ios' ? undefined : ui.colors.surfaceContainer}
            >
              <Ionicons
                name="add"
                size={33}
                color={createActive ? ui.colors.inverseText : ui.colors.accentStrong}
              />
            </LiquidGlassSurface>
          </Animated.View>
        </MotionPressable>
      </LiquidGlassGroup>
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
  barGestureHost: {
    flex: 1,
    minWidth: 0,
    height: 68,
    borderRadius: 34,
  },
  bar: {
    width: '100%',
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    ...ui.shadow.floating,
  },
  fallback: {
    backgroundColor: ui.colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.colors.borderStrong,
  },
  activeIndicator: {
    position: 'absolute',
    left: 5,
    top: 5,
    height: 58,
    borderRadius: 29,
    overflow: 'visible',
    zIndex: 0,
  },
  activeIndicatorGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    overflow: 'hidden',
  },
  activeIndicatorFallback: {
    backgroundColor: ui.colors.surfaceContainerHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.colors.borderStrong,
  },
  dragSheen: {
    position: 'absolute',
    left: -6,
    right: -6,
    top: -3,
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  itemContent: {
    width: '100%',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  createHitArea: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  createButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.floating,
  },
  createButtonActive: {
    backgroundColor: ui.colors.accentStrong,
  },
  createFallbackActive: {
    backgroundColor: ui.colors.accentStrong,
    borderColor: ui.colors.accentStrong,
  },
});
