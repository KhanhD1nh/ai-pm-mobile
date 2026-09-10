import { Platform } from "react-native";
import type { AiPmFocusWidgetProps } from "./ai-pm-focus-widget";

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

export async function clearAiPmFocusWidget(): Promise<void> {
  await updateAiPmFocusWidget({
    title: "AI-PM",
    primaryMetric: "—",
    primaryMetricLabel: "Đăng nhập để xem công việc",
    secondaryMetric: "0",
    secondaryMetricLabel: "đang làm",
    focusIdentifier: "AI-PM",
    focusTitle: "Mở ứng dụng để tiếp tục",
    focusMeta: "",
    primaryUrl: "aipm://login",
    updatedLabel: "",
  });
}
