import {
  GlassContainer,
  GlassView,
  isLiquidGlassAvailable,
  type GlassColorScheme,
  type GlassStyle,
  type GlassViewProps,
} from 'expo-glass-effect';
import { type PropsWithChildren } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export type GlassPresetName = 'floatingTabBar' | 'compactControl' | string;
export type GlassVariant = 'regular' | 'clear' | string;

function canUseNativeGlass() {
  return Platform.OS === 'ios' && isLiquidGlassAvailable();
}

export function LiquidGlassGroup({
  children,
  spacing = 12,
  style,
}: PropsWithChildren<{
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  if (!canUseNativeGlass()) return <View style={style}>{children}</View>;

  return (
    <GlassContainer spacing={spacing} style={style}>
      {children}
    </GlassContainer>
  );
}

export function LiquidGlassSurface({
  children,
  style,
  fallbackStyle,
  preset,
  variant,
  interactive = false,
  tilt: _tilt = false,
  tintColor,
  borderRadius,
  accessibilityMode: _accessibilityMode = 'auto',
  rim: _rim,
  specular: _specular,
  thickness: _thickness,
  blurRadius: _blurRadius,
  dim: _dim,
  colorScheme = 'auto',
  ...viewProps
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  preset?: GlassPresetName;
  variant?: GlassVariant;
  interactive?: boolean;
  tilt?: boolean;
  tintColor?: ColorValue;
  borderRadius?: number;
  accessibilityMode?: 'auto' | string;
  rim?: boolean;
  specular?: boolean;
  thickness?: number;
  blurRadius?: number;
  dim?: number;
  colorScheme?: GlassColorScheme;
}> & Omit<GlassViewProps, 'style' | 'children' | 'tintColor' | 'isInteractive' | 'glassEffectStyle' | 'colorScheme'>) {
  const flattened = StyleSheet.flatten(style) as ViewStyle | undefined;
  const resolvedRadius = borderRadius ?? (typeof flattened?.borderRadius === 'number' ? flattened.borderRadius : undefined);

  if (!canUseNativeGlass()) {
    return <View {...(viewProps as ViewProps)} style={[style, fallbackStyle]}>{children}</View>;
  }

  const glassEffectStyle: GlassStyle = variant === 'clear' || preset === 'compactControl' ? 'clear' : 'regular';
  const resolvedTint = typeof tintColor === 'string' ? tintColor : undefined;

  return (
    <GlassView
      {...viewProps}
      glassEffectStyle={glassEffectStyle}
      isInteractive={interactive}
      tintColor={resolvedTint}
      colorScheme={colorScheme}
      // Native Liquid Glass owns its mask/refraction edge. Clipping the
      // UIVisualEffectView with overflow:hidden flattens the specular rim and
      // makes clear glass look like an opaque blur panel, especially in dark
      // mode. Keep the radius, but let the native material draw outside its
      // internal sampling bounds.
      style={[style, resolvedRadius != null && { borderRadius: resolvedRadius }]}
    >
      {children}
    </GlassView>
  );
}
