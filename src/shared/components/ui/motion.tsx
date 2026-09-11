import { type PropsWithChildren } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useReducedMotion,
} from "react-native-reanimated";

export function FadeInView({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.duration(220)
              .delay(delay)
              .easing(Easing.out(Easing.cubic))
      }
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function SoftFade({
  children,
  delay = 0,
  style,
}: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(180).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function FocusTransitionView({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={style}>{children}</View>;
}

export function CrossfadeSwap({
  children,
  transitionKey,
  style,
}: PropsWithChildren<{
  transitionKey: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={[styles.swapRoot, style]}>
      <Animated.View
        key={transitionKey}
        entering={
          reduceMotion
            ? undefined
            : FadeIn.duration(180).easing(Easing.out(Easing.quad))
        }
        exiting={
          reduceMotion
            ? undefined
            : FadeOut.duration(120).easing(Easing.in(Easing.quad))
        }
        style={StyleSheet.absoluteFill}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export function MotionPressable({
  children,
  style,
  disabled,
  ...props
}: PropsWithChildren<PressableProps & { style?: StyleProp<ViewStyle> }>) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <Pressable
        {...props}
        disabled={disabled}
        style={({ pressed }) => [
          style,
          pressed && { opacity: 0.82 },
          disabled && { opacity: 0.45 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  if (Platform.OS === "android") {
    return (
      <Pressable
        {...props}
        disabled={disabled}
        android_ripple={
          props.android_ripple ?? {
            color: "rgba(127,127,127,0.16)",
            borderless: false,
            foreground: true,
          }
        }
        style={({ pressed }) => [
          style,
          pressed && { opacity: 0.97 },
          disabled && { opacity: 0.45 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && { transform: [{ scale: 0.992 }], opacity: 0.9 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swapRoot: { flex: 1, minHeight: 0 },
});
