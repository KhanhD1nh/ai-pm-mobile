import * as Updates from "expo-updates";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AppState } from "react-native";
import {
  checkForOtaUpdate,
  downloadAndApplyOtaUpdate,
  getOtaApplyPhase,
  subscribeOtaApplyPhase,
} from "@/infrastructure/updates/update-service";
import { AppDialog } from "@/shared/components/ui/app-dialog";
import { AppUpdateOverlay } from "@/shared/components/ui/app-update-overlay";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

const FOREGROUND_CHECK_COOLDOWN_MS = 15 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 1_200;

type UpdateBootstrapDialog =
  { kind: "available" } | { kind: "error"; message: string };

export function UpdateBootstrap() {
  const { language, theme: ui } = useAppPreferences();
  const otaState = Updates.useUpdates();
  const applyPhase = useSyncExternalStore(
    subscribeOtaApplyPhase,
    getOtaApplyPhase,
    getOtaApplyPhase,
  );
  const checkingRef = useRef(false);
  const dismissedForSessionRef = useRef(false);
  const lastCheckAtRef = useRef(0);
  const [dialog, setDialog] = useState<UpdateBootstrapDialog | null>(null);
  const vi = language === "vi";

  const check = useCallback(async () => {
    const now = Date.now();
    if (checkingRef.current || dismissedForSessionRef.current) return;
    if (now - lastCheckAtRef.current < FOREGROUND_CHECK_COOLDOWN_MS) return;

    checkingRef.current = true;
    lastCheckAtRef.current = now;

    try {
      const result = await checkForOtaUpdate();
      if (result.status !== "available") return;

      dismissedForSessionRef.current = true;
      setDialog({ kind: "available" });
    } catch {
      // OTA checks are best-effort. A network/update service failure should
      // never block the user from opening or continuing to use the app.
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const handleApplyUpdate = () => {
    setDialog(null);
    void downloadAndApplyOtaUpdate({
      reloadScreenAppearance: {
        backgroundColor: ui.colors.bg,
        spinnerColor: ui.colors.accentStrong,
      },
    }).catch((error) => {
      setDialog({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    });
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => void check(), INITIAL_CHECK_DELAY_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });

    return () => {
      clearTimeout(initialTimer);
      subscription.remove();
    };
  }, [check]);

  const overlayPhase =
    applyPhase !== "idle"
      ? applyPhase
      : otaState.isRestarting
        ? "restarting"
        : otaState.isDownloading
          ? "downloading"
          : null;
  const downloadProgress =
    overlayPhase === "downloading" &&
    typeof otaState.downloadProgress === "number"
      ? Math.min(1, Math.max(0, otaState.downloadProgress))
      : overlayPhase === "restarting"
        ? 1
        : null;

  return (
    <>
      <AppDialog
        visible={dialog !== null}
        tone={dialog?.kind === "error" ? "danger" : "info"}
        title={
          dialog?.kind === "error"
            ? vi
              ? "Không thể cập nhật"
              : "Update failed"
            : vi
              ? "Có bản cập nhật mới"
              : "Update available"
        }
        message={
          dialog?.kind === "error"
            ? dialog.message
            : vi
              ? "AI-PM có bản cập nhật mới. Bạn có thể cập nhật ngay mà không cần cài lại ứng dụng."
              : "A new AI-PM update is ready. You can install it without reinstalling the app."
        }
        primaryAction={{
          label:
            dialog?.kind === "error"
              ? "OK"
              : vi
                ? "Cập nhật ngay"
                : "Update now",
          onPress:
            dialog?.kind === "error"
              ? () => setDialog(null)
              : handleApplyUpdate,
        }}
        secondaryAction={
          dialog?.kind === "available"
            ? {
                label: vi ? "Để sau" : "Later",
                onPress: () => setDialog(null),
              }
            : undefined
        }
        onRequestClose={() => setDialog(null)}
        ui={ui}
      />
      <AppUpdateOverlay
        visible={overlayPhase !== null}
        phase={overlayPhase ?? "downloading"}
        progress={downloadProgress}
        ui={ui}
        vi={vi}
      />
    </>
  );
}
