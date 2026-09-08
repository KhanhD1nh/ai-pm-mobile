import Ionicons, {
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { Button } from "@/shared/components/ui/primitives";
import { MotionPressable } from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

type Slide = {
  icon: IoniconsIconName;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
};

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const { theme: ui, language } = useAppPreferences();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const slides = useMemo<Slide[]>(
    () =>
      language === "vi"
        ? [
            {
              icon: "sparkles-outline",
              eyebrow: "AI-PM MOBILE",
              title: "Công việc rõ ràng. AI làm phần nặng.",
              body: "Theo dõi dự án, issue và tiến độ ở một nơi — tối ưu cho những phiên làm việc nhanh trên điện thoại.",
              bullets: [
                "Project và issue luôn đồng bộ",
                "Tập trung vào việc cần xử lý tiếp theo",
              ],
            },
            {
              icon: "calendar-outline",
              eyebrow: "LẬP KẾ HOẠCH",
              title: "Biết hôm nay cần làm gì.",
              body: "Chu kỳ, milestone và lịch tập trung giúp bạn biến backlog thành kế hoạch có thể thực hiện.",
              bullets: [
                "Cycle và milestone theo dự án",
                "Lịch và focus session ngay trên mobile",
              ],
            },
            {
              icon: "flash-outline",
              eyebrow: "TỰ ĐỘNG HÓA",
              title: "Để agent và automation hỗ trợ bạn.",
              body: "Kết nối AI agents, Telegram và thông báo để những thay đổi quan trọng tự tìm đến bạn.",
              bullets: [
                "AI agents và workflow",
                "Thông báo và deep link đến đúng ngữ cảnh",
              ],
            },
          ]
        : [
            {
              icon: "sparkles-outline",
              eyebrow: "AI-PM MOBILE",
              title: "Clear work. AI handles the heavy lifting.",
              body: "Track projects, issues and progress in one place, designed for quick mobile work sessions.",
              bullets: [
                "Projects and issues stay in sync",
                "Focus on what needs attention next",
              ],
            },
            {
              icon: "calendar-outline",
              eyebrow: "PLANNING",
              title: "Know what matters today.",
              body: "Cycles, milestones and focused scheduling turn your backlog into an actionable plan.",
              bullets: [
                "Project cycles and milestones",
                "Schedule and focus sessions on mobile",
              ],
            },
            {
              icon: "flash-outline",
              eyebrow: "AUTOMATION",
              title: "Let agents and automations assist you.",
              body: "Connect AI agents, Telegram and notifications so important changes reach you automatically.",
              bullets: [
                "AI agents and workflows",
                "Notifications and deep links to the right context",
              ],
            },
          ],
    [language],
  );

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      await onComplete();
    } finally {
      setFinishing(false);
    }
  };

  const next = () => {
    if (index === slides.length - 1) {
      void finish();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: !reduceMotion,
    });
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(
      Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)),
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>AI</Text>
          </View>
          <Text style={styles.brandText}>AI-PM</Text>
        </View>
        <MotionPressable
          accessibilityRole="button"
          onPress={() => void finish()}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>
            {language === "vi" ? "Bỏ qua" : "Skip"}
          </Text>
        </MotionPressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.eyebrow}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <View style={styles.visual}>
              <View style={styles.visualHalo} />
              <View style={styles.iconSurface}>
                <Ionicons
                  name={item.icon}
                  size={54}
                  color={ui.colors.accentStrong}
                />
              </View>
            </View>
            <View style={styles.copy}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <View style={styles.bullets}>
                {item.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.check}>
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={ui.colors.accentStrong}
                      />
                    </View>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View
          accessibilityLabel={`${index + 1} / ${slides.length}`}
          style={styles.dots}
        >
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.eyebrow}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          title={
            finishing
              ? language === "vi"
                ? "Đang mở…"
                : "Opening…"
              : index === slides.length - 1
                ? language === "vi"
                  ? "Bắt đầu"
                  : "Get started"
                : language === "vi"
                  ? "Tiếp tục"
                  : "Continue"
          }
          disabled={finishing}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.colors.bg },
    topBar: {
      minHeight: 58,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandMark: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentStrong,
    },
    brandMarkText: {
      color: ui.colors.inverseText,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: -0.3,
    },
    brandText: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 15,
    },
    skipButton: {
      minWidth: 64,
      minHeight: 44,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    skipText: {
      color: ui.colors.textSecondary,
      ...ui.typography.bodyStrong,
      fontSize: 14,
    },
    page: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 8,
      justifyContent: "center",
      gap: 32,
    },
    visual: { height: 230, alignItems: "center", justifyContent: "center" },
    visualHalo: {
      position: "absolute",
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: ui.colors.accentSoft,
      opacity: 0.7,
    },
    iconSurface: {
      width: 132,
      height: 132,
      borderRadius: 38,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      ...ui.shadow.floating,
    },
    copy: { width: "100%", maxWidth: 430, alignSelf: "center" },
    eyebrow: {
      color: ui.colors.accentStrong,
      ...ui.typography.eyebrow,
      marginBottom: 8,
    },
    title: {
      color: ui.colors.text,
      ...ui.typography.hero,
      fontSize: 32,
      lineHeight: 38,
    },
    body: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 12,
    },
    bullets: { gap: 11, marginTop: 22 },
    bulletRow: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
    },
    bulletText: {
      flex: 1,
      color: ui.colors.text,
      ...ui.typography.body,
      fontSize: 15,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 18,
    },
    dots: {
      height: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: ui.colors.borderStrong,
    },
    dotActive: { width: 22, backgroundColor: ui.colors.accentStrong },
  });
