import { HStack, Image, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type AiPmFocusWidgetProps = {
  title: string;
  primaryMetric: string;
  primaryMetricLabel: string;
  secondaryMetric: string;
  secondaryMetricLabel: string;
  focusIdentifier: string;
  focusTitle: string;
  focusMeta: string;
  primaryUrl: string;
  updatedLabel: string;
};

const AiPmFocusWidgetLayout = (
  props: AiPmFocusWidgetProps,
  environment: WidgetEnvironment,
) => {
  "widget";

  // WidgetKit calls the gallery placeholder/snapshot with nil props before the
  // host app has written its first timeline. Never read props directly here or
  // the isolated widget runtime can fail and leave a black/blank preview.
  const title = props?.title ?? "AI-PM";
  const primaryMetric = props?.primaryMetric ?? "0";
  const primaryMetricLabel = props?.primaryMetricLabel ?? "quá hạn";
  const secondaryMetric = props?.secondaryMetric ?? "0";
  const secondaryMetricLabel = props?.secondaryMetricLabel ?? "đang làm";
  const focusIdentifier = props?.focusIdentifier ?? "AI-PM";
  const focusTitle = props?.focusTitle ?? "Mở AI-PM để đồng bộ công việc";
  const focusMeta = props?.focusMeta ?? "Dữ liệu sẽ tự cập nhật";
  const primaryUrl = props?.primaryUrl ?? "aipm://my-work";
  const updatedLabel = props?.updatedLabel ?? "Sẵn sàng";

  const accent = environment.colorScheme === "dark" ? "#85B8FF" : "#0052CC";
  const primary = environment.colorScheme === "dark" ? "#F4F5F7" : "#172B4D";
  const secondary = environment.colorScheme === "dark" ? "#AEB7C4" : "#5E6C84";
  const background = environment.colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";

  if (environment.widgetFamily === "systemSmall") {
    return (
      <Link destination={primaryUrl}>
        <VStack
          alignment="leading"
          spacing={8}
          modifiers={[
            containerBackground(background, "widget"),
            foregroundStyle(primary),
            padding({ all: 14 }),
          ]}
        >
          <HStack spacing={6}>
            <Image systemName="checkmark.circle.fill" color={accent} />
            <Text modifiers={[font({ size: 14, weight: "semibold" })]}>
              {title}
            </Text>
          </HStack>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 30, weight: "bold" }),
              foregroundStyle(accent),
            ]}
          >
            {primaryMetric}
          </Text>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary)]}>
            {primaryMetricLabel}
          </Text>
          <Text modifiers={[font({ size: 12, weight: "semibold" })]}>
            {focusIdentifier}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
            {focusTitle}
          </Text>
        </VStack>
      </Link>
    );
  }

  return (
    <Link destination={primaryUrl}>
      <VStack
        alignment="leading"
        spacing={9}
        modifiers={[
          containerBackground(background, "widget"),
          foregroundStyle(primary),
          padding({ all: 15 }),
        ]}
      >
        <HStack spacing={7}>
          <Image systemName="checkmark.circle.fill" color={accent} />
          <Text modifiers={[font({ size: 15, weight: "semibold" })]}>
            {title}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>
            {updatedLabel}
          </Text>
        </HStack>
        <HStack spacing={18}>
          <VStack alignment="leading" spacing={1}>
            <Text
              modifiers={[
                font({ size: 24, weight: "bold" }),
                foregroundStyle(accent),
              ]}
            >
              {primaryMetric}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
              {primaryMetricLabel}
            </Text>
          </VStack>
          <VStack alignment="leading" spacing={1}>
            <Text modifiers={[font({ size: 24, weight: "bold" })]}>
              {secondaryMetric}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
              {secondaryMetricLabel}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: "semibold" })]}>
            {focusIdentifier}
          </Text>
          <Text modifiers={[font({ size: 13, weight: "medium" })]}>
            {focusTitle}
          </Text>
          <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>
            {focusMeta}
          </Text>
        </VStack>
      </VStack>
    </Link>
  );
};

export const AiPmFocusWidget = createWidget(
  "AiPmFocusWidget",
  AiPmFocusWidgetLayout,
);
