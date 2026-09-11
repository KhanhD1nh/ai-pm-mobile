import {
  Alert,
  Platform,
  type AlertButton,
  type AlertOptions,
} from "react-native";
import type { AppDialogTone } from "@/shared/components/ui/app-dialog";

export type AppAlertOptions = AlertOptions & { tone?: AppDialogTone };

export type AppAlertSnapshot = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  cancelable: boolean;
  onDismiss?: () => void;
  tone: AppDialogTone;
};

let nextId = 1;
let current: AppAlertSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function inferTone(title: string, buttons: AlertButton[]): AppDialogTone {
  if (buttons.some((button) => button.style === "destructive")) return "danger";
  const normalizedTitle = title.toLocaleLowerCase();
  if (
    normalizedTitle.includes("không thể") ||
    normalizedTitle.includes("lỗi") ||
    normalizedTitle.includes("thất bại") ||
    normalizedTitle.includes("failed") ||
    normalizedTitle.includes("error")
  ) {
    return "danger";
  }
  return "info";
}

export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AppAlertOptions,
) {
  const { tone, ...nativeOptions } = options ?? {};
  if (Platform.OS !== "android" || (buttons?.length ?? 0) > 3) {
    Alert.alert(title, message, buttons, nativeOptions);
    return;
  }

  const resolvedButtons =
    buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
  current = {
    id: nextId++,
    title,
    message,
    buttons: resolvedButtons,
    cancelable: options?.cancelable ?? true,
    onDismiss: options?.onDismiss,
    tone: tone ?? inferTone(title, resolvedButtons),
  };
  emit();
}

export function subscribeAppAlert(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAppAlertSnapshot() {
  return current;
}

export function dismissAppAlert(id?: number, invokeDismiss = true) {
  if (!current || (id != null && current.id !== id)) return;
  const onDismiss = current.onDismiss;
  current = null;
  emit();
  if (invokeDismiss) onDismiss?.();
}
