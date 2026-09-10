import { HStack, Image, Link, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
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

  const accent = environment.colorScheme === "dark" ? "#85B8FF" : "#0052CC";
  const secondary = environment.colorScheme === "dark" ? "#AEB7C4" : "#5E6C84";

  if (environment.widgetFamily === "systemSmall") {
    return (
      <Link destination={props.primaryUrl}>
        <VStack
          alignment="leading"
          spacing={8}
          modifiers={[padding({ all: 14 })]}
        >
          <HStack spacing={6}>
            <Image systemName="checkmark.circle.fill" color={accent} />
            <Text modifiers={[font({ size: 14, weight: "semibold" })]}>
              {props.title}
            </Text>
          </HStack>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 30, weight: "bold" }),
              foregroundStyle(accent),
            ]}
          >
            {props.primaryMetric}
          </Text>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary)]}>
            {props.primaryMetricLabel}
          </Text>
          <Text modifiers={[font({ size: 12, weight: "semibold" })]}>
            {props.focusIdentifier}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
            {props.focusTitle}
          </Text>
        </VStack>
      </Link>
    );
  }

  return (
    <Link destination={props.primaryUrl}>
      <VStack
        alignment="leading"
        spacing={9}
        modifiers={[padding({ all: 15 })]}
      >
        <HStack spacing={7}>
          <Image systemName="checkmark.circle.fill" color={accent} />
          <Text modifiers={[font({ size: 15, weight: "semibold" })]}>
            {props.title}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>
            {props.updatedLabel}
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
              {props.primaryMetric}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
              {props.primaryMetricLabel}
            </Text>
          </VStack>
          <VStack alignment="leading" spacing={1}>
            <Text modifiers={[font({ size: 24, weight: "bold" })]}>
              {props.secondaryMetric}
            </Text>
            <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
              {props.secondaryMetricLabel}
            </Text>
          </VStack>
          <Spacer />
        </HStack>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 12, weight: "semibold" })]}>
            {props.focusIdentifier}
          </Text>
          <Text modifiers={[font({ size: 13, weight: "medium" })]}>
            {props.focusTitle}
          </Text>
          <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>
            {props.focusMeta}
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
