import { useMemo, useSyncExternalStore } from "react";
import type { AlertButton } from "react-native";
import {
  dismissAppAlert,
  getAppAlertSnapshot,
  subscribeAppAlert,
} from "@/shared/feedback/app-alert";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { AppDialog, type AppDialogAction } from "./app-dialog";

function actionFromButton(
  button: AlertButton,
  close: (invokeDismiss?: boolean) => void,
): AppDialogAction {
  return {
    label: button.text ?? "OK",
    destructive: button.style === "destructive",
    onPress: () => {
      close(false);
      button.onPress?.();
    },
  };
}

export function AppAlertHost() {
  const { theme: ui } = useAppPreferences();
  const alert = useSyncExternalStore(
    subscribeAppAlert,
    getAppAlertSnapshot,
    getAppAlertSnapshot,
  );

  const actions = useMemo(() => {
    if (!alert) return null;
    const close = (invokeDismiss = true) =>
      dismissAppAlert(alert.id, invokeDismiss);
    const primaryButton =
      [...alert.buttons]
        .reverse()
        .find((button) => button.style !== "cancel") ?? alert.buttons[0];
    const rest = alert.buttons.filter((button) => button !== primaryButton);
    return {
      close,
      primary: actionFromButton(primaryButton, close),
      secondary: rest[0] ? actionFromButton(rest[0], close) : undefined,
      tertiary: rest[1] ? actionFromButton(rest[1], close) : undefined,
      cancel: alert.buttons.find((button) => button.style === "cancel"),
    };
  }, [alert]);

  if (!alert || !actions) return null;

  return (
    <AppDialog
      visible
      tone={alert.tone}
      title={alert.title}
      message={alert.message}
      primaryAction={actions.primary}
      secondaryAction={actions.secondary}
      tertiaryAction={actions.tertiary}
      onRequestClose={() => {
        if (!alert.cancelable) return;
        actions.close(false);
        actions.cancel?.onPress?.();
        alert.onDismiss?.();
      }}
      ui={ui}
    />
  );
}
