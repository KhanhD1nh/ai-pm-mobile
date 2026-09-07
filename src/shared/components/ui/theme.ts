import { Platform } from 'react-native';

const systemFont = Platform.OS === 'web'
  ? 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  : undefined;

const shared = {
  header: {
    actionSize: Platform.OS === 'android' ? 48 : 44,
    iconSize: 22,
    horizontalInset: 16,
    verticalInset: 4,
  },
  radius: {
    xs: 8,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    round: 999,
  },
  spacing: {
    xxs: 4,
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  typography: {
    display: { fontFamily: systemFont, fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.9 },
    hero: { fontFamily: systemFont, fontSize: 34, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -1.05 },
    screenTitle: { fontFamily: systemFont, fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.8 },
    metric: { fontFamily: systemFont, fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.9 },
    title: { fontFamily: systemFont, fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
    heading: { fontFamily: systemFont, fontSize: 17, lineHeight: 23, fontWeight: '600' as const, letterSpacing: -0.12 },
    body: { fontFamily: systemFont, fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    bodyStrong: { fontFamily: systemFont, fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
    caption: { fontFamily: systemFont, fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
    eyebrow: { fontFamily: systemFont, fontSize: 11, lineHeight: 15, fontWeight: '600' as const, letterSpacing: 0.6 },
  },
  motion: {
    fast: 120,
    normal: 200,
    slow: 280,
  },
} as const;

export const lightTheme = {
  colors: {
    bg: '#FFFFFF',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceRaised: '#F2F2F7',
    surfaceSoft: '#F7F7F9',
    surfaceAccent: '#FFF1EA',
    surfaceContainer: '#F0F1F3',
    surfaceContainerHigh: '#E8EBEE',
    primaryContainer: '#FFE1D2',
    onPrimaryContainer: '#6E3217',
    border: '#E7E7EC',
    borderStrong: '#D2D2D8',
    text: '#1D1D1F',
    inverseText: '#FFFFFF',
    textSecondary: '#515154',
    textMuted: '#86868B',
    accent: '#F88751',
    // Darker foreground accent meets contrast requirements on white while the
    // brighter `accent` remains available for decorative fills/highlights.
    accentStrong: '#C4511E',
    accentSoft: '#FFF0E8',
    success: '#779647',
    successSoft: '#F0F5E7',
    warning: '#D49A42',
    warningSoft: '#FFF6E5',
    danger: '#D95F63',
    dangerSoft: '#FFF0F1',
    overlay: 'rgba(24, 27, 31, 0.30)',
    shadow: '#6A7179',
  },
  shadow: {
    card: { shadowColor: '#6A7179', shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 0 },
    floating: { shadowColor: '#6A7179', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 5 },
  },
  ...shared,
} as const;

export const darkTheme = {
  colors: {
    bg: '#0B0B0D',
    bgElevated: '#151517',
    surface: '#1C1C1E',
    surfaceRaised: '#2C2C2E',
    surfaceSoft: '#171719',
    surfaceAccent: '#34231C',
    surfaceContainer: '#232529',
    surfaceContainerHigh: '#2B2E33',
    primaryContainer: '#573120',
    onPrimaryContainer: '#FFD9C7',
    border: '#2A2D32',
    borderStrong: '#3A3E45',
    text: '#F5F5F7',
    inverseText: '#1D1D1F',
    textSecondary: '#D1D1D6',
    textMuted: '#8E8E93',
    accent: '#FF9564',
    accentStrong: '#F88751',
    accentSoft: 'rgba(248, 135, 81, 0.16)',
    success: '#9AB864',
    successSoft: 'rgba(154, 184, 100, 0.14)',
    warning: '#E3B15D',
    warningSoft: 'rgba(227, 177, 93, 0.14)',
    danger: '#EA7C81',
    dangerSoft: 'rgba(234, 124, 129, 0.14)',
    overlay: 'rgba(0, 0, 0, 0.68)',
    shadow: '#000000',
  },
  shadow: {
    card: { shadowColor: '#000000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
    floating: { shadowColor: '#000000', shadowOpacity: 0.30, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  },
  ...shared,
} as const;

export type AppTheme = typeof darkTheme | typeof lightTheme;
export const ui = lightTheme;
