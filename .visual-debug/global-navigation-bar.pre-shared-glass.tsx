import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassSurface } from '@/shared/components/ui/glass';
import { MotionPressable } from '@/shared/components/ui/motion';
import {
  NAV_BAR_HEIGHT,
  NAV_BAR_PADDING,
  clampNavigationValue,
  navigationLensFrame,
} from '@/shared/components/ui/navigation-geometry';
import type { NavigationSelection } from '@/shared/components/ui/navigation-selection';
import { useNavigationScrub } from '@/shared/components/ui/use-navigation-scrub';
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
  index,
  routeActive,
  position,
  selection,
  reduceMotion,
  ui,
  styles,
  onAccessiblePress,
}: {
  item: NavItem;
  index: number;
  routeActive: boolean;
  position: SharedValue<number>;
  selection: SharedValue<NavigationSelection>;
  reduceMotion: SharedValue<boolean>;
  ui: AppTheme;
  styles: ReturnType<typeof createStyles>;
  onAccessiblePress: () => void;
}) {
  const contentStyle = useAnimatedStyle(() => {
    const distance = Math.abs(position.get() - index);
    const progress = clampNavigationValue(1 - distance, 0, 1);
    const dragging = selection.get().dragging;
    const scale = reduceMotion.get() ? 1 : 0.97 + progress * (dragging ? 0.11 : 0.07);
    const translateY = reduceMotion.get() ? 0 : -progress * (dragging ? 1.4 : 0.5);
    return { transform: [{ translateY }, { scale }] };
  });
  const activeIconStyle = useAnimatedStyle(() => {
    const progress = clampNavigationValue(1 - Math.abs(position.get() - index), 0, 1);
    return { opacity: progress };
  });
  const inactiveIconStyle = useAnimatedStyle(() => {
    const progress = clampNavigationValue(1 - Math.abs(position.get() - index), 0, 1);
    return { opacity: 1 - progress };
  });

  return (
    <View
      testID={`navigation-tab-${item.key}`}
      accessible
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: routeActive }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityTap={onAccessiblePress}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') onAccessiblePress();
      }}
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
    </View>
  );
}

export function GlobalNavigationBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme: ui, resolvedTheme, language, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [barWidth, setBarWidth] = useState(0);

  const routeKey = activeKeyForPath(pathname);
  const items = useMemo<NavItem[]>(() => [
    { key: 'home', label: t('nav.home'), icon: 'home-outline', activeIcon: 'home', href: '/home' },
    { key: 'projects', label: t('nav.projects'), icon: 'folder-outline', activeIcon: 'folder', href: '/projects' },
    { key: 'inbox', label: t('nav.inbox'), icon: 'chatbox-outline', activeIcon: 'chatbox', href: '/inbox' },
    { key: 'more', label: t('nav.more'), icon: 'person-circle-outline', activeIcon: 'person-circle', href: '/more' },
  ], [t]);
  const itemCount = items.length;
  const activeIndex = items.findIndex((item) => item.key === routeKey);
  const createActive = routeKey === 'create';
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const isAtActiveTabRoot = Boolean(activeItem && (
    pathname === activeItem.href || (activeItem.key === 'home' && pathname === '/')
  ));

  const navigateToIndex = useCallback((index: number) => {
    const item = items[index];
    if (!item) return;
    if (pathname === item.href || (item.key === 'home' && pathname === '/')) return;
    router.navigate(item.href);
  }, [items, pathname]);

  const {
    gesture: scrubGesture,
    position,
    velocity,
    selection,
    reduceMotion,
    selectAccessible,
  } = useNavigationScrub({
    routeIndex: activeIndex,
    routeKey: pathname,
    externalRoute: false,
    reselectNavigates: !isAtActiveTabRoot,
    width: barWidth,
    count: itemCount,
    onSelect: navigateToIndex,
    onHaptic: selectionHaptic,
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const dragging = selection.get().dragging;
    const frame = navigationLensFrame(
      position.get(),
      barWidth,
      itemCount,
      reduceMotion.get() || !dragging ? 0 : 1,
      reduceMotion.get() ? 0 : velocity.get(),
    );
    return {
      // Detail/stack routes intentionally have activeIndex === -1. The scrub
      // state machine keeps its last valid position, so the lens must remain
      // visible instead of disappearing or being fed an invalid coordinate.
      display: frame.width > 0 ? 'flex' : 'none',
      width: frame.width,
      height: frame.height,
      top: frame.top,
      transform: [{ translateX: frame.left }],
    };
  }, [barWidth, itemCount, reduceMotion, selection, velocity]);

  const onBarLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - barWidth) > 0.5) setBarWidth(nextWidth);
  };

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
              variant="clear"
              colorScheme={resolvedTheme}
              style={styles.barBackground}
              fallbackStyle={styles.fallback}
            />

            <View collapsable={false} pointerEvents="none" style={styles.lensLayer}>
              <Animated.View testID="navigation-selection" style={[styles.activeIndicator, indicatorStyle]}>
                <LiquidGlassSurface
                  pointerEvents="none"
                  accessible={false}
                  preset="compactControl"
                  variant="clear"
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
                  index={index}
                  routeActive={activeIndex === index}
                  position={position}
                  selection={selection}
                  reduceMotion={reduceMotion}
                  ui={ui}
                  styles={styles}
                  onAccessiblePress={() => selectAccessible(index)}
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
            variant="clear"
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
            <View pointerEvents="none">
              <Ionicons accessible={false} name="add" size={33} color={ui.colors.accentStrong} />
            </View>
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
  lensLayer: {
    position: 'absolute',
    inset: 0,
    borderRadius: NAV_BAR_HEIGHT / 2,
    overflow: 'visible',
    zIndex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    borderRadius: 999,
  },
  activeIndicatorGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
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
