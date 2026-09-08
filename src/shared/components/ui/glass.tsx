import {
  GlassView,
  isLiquidGlassAvailable,
  type GlassColorScheme,
  type GlassStyle,
  type GlassViewProps,
} from "expo-glass-effect";
import { useEffect, useState, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

export type GlassVariant = "regular" | "clear" | string;

function useCanUseNativeGlass() {
  const [reduceTransparency, setReduceTransparency] = useState<boolean | null>(
    Platform.OS === "ios" ? null : false,
  );

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) setReduceTransparency(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return (
    Platform.OS === "ios" &&
    reduceTransparency === false &&
    isLiquidGlassAvailable()
  );
}

export function LiquidGlassSurface({
  children,
  style,
  fallbackStyle,
  variant,
  interactive = false,
  tintColor,
  borderRadius,
  colorScheme = "auto",
  ...viewProps
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
  interactive?: boolean;
  tintColor?: ColorValue;
  borderRadius?: number;
  colorScheme?: GlassColorScheme;
}> &
  Omit<
    GlassViewProps,
    | "style"
    | "children"
    | "tintColor"
    | "isInteractive"
    | "glassEffectStyle"
    | "colorScheme"
  >) {
  const canUseNativeGlass = useCanUseNativeGlass();
  const flattened = StyleSheet.flatten(style) as ViewStyle | undefined;
  const resolvedRadius =
    borderRadius ??
    (typeof flattened?.borderRadius === "number"
      ? flattened.borderRadius
      : undefined);

  if (!canUseNativeGlass) {
    return (
      <View {...(viewProps as ViewProps)} style={[style, fallbackStyle]}>
        {children}
      </View>
    );
  }

  const glassEffectStyle: GlassStyle =
    variant === "clear" ? "clear" : "regular";
  const resolvedTint = typeof tintColor === "string" ? tintColor : undefined;

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
      style={[
        style,
        resolvedRadius != null && { borderRadius: resolvedRadius },
      ]}
    >
      {children}
    </GlassView>
  );
}
