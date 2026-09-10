import { Platform } from "react-native";
import type { AiPmFocusWidgetProps } from "./ai-pm-focus-widget";

const EMPTY_AI_PM_FOCUS_WIDGET_SNAPSHOT: AiPmFocusWidgetProps = {
  title: "AI-PM",
  primaryMetric: "0",
  primaryMetricLabel: "quá hạn",
  secondaryMetric: "0",
  secondaryMetricLabel: "đang làm",
  focusIdentifier: "AI-PM",
  focusTitle: "Mở AI-PM để đồng bộ công việc",
  focusMeta: "Dữ liệu sẽ tự cập nhật",
  primaryUrl: "aipm://my-work",
  updatedLabel: "Sẵn sàng",
};

export async function updateAiPmFocusWidget(
  snapshot: AiPmFocusWidgetProps,
): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    const { AiPmFocusWidget } = await import("./ai-pm-focus-widget");
    AiPmFocusWidget.updateSnapshot(snapshot);
  } catch (error) {
    if (__DEV__)
      console.warn("[Widgets] Could not update AI-PM Focus widget", error);
  }
}

export async function ensureAiPmFocusWidgetSnapshot(): Promise<void> {
  if (Platform.OS !== "ios") return;

  try {
    const { AiPmFocusWidget } = await import("./ai-pm-focus-widget");
    const timeline = await AiPmFocusWidget.getTimeline();
    if (timeline.length === 0) {
      AiPmFocusWidget.updateSnapshot(EMPTY_AI_PM_FOCUS_WIDGET_SNAPSHOT);
      return;
    }
    // createWidget registers the latest serialized layout when this module is
    // imported. Reload an existing timeline as well so an OTA layout fix is
    // reflected immediately in Widget Gallery/Home Screen previews.
    AiPmFocusWidget.reload();
  } catch (error) {
    if (__DEV__)
      console.warn("[Widgets] Could not seed AI-PM Focus widget", error);
  }
}

export async function clearAiPmFocusWidget(): Promise<void> {
  await updateAiPmFocusWidget({
    title: "AI-PM",
    primaryMetric: "0",
    primaryMetricLabel: "quá hạn",
    secondaryMetric: "0",
    secondaryMetricLabel: "đang làm",
    focusIdentifier: "AI-PM",
    focusTitle: "Đăng nhập để xem công việc",
    focusMeta: "Mở ứng dụng để tiếp tục",
    primaryUrl: "aipm://login",
    updatedLabel: "Đăng nhập",
  });
}
