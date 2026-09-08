import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import {
  checkForOtaUpdate,
  downloadAndApplyOtaUpdate,
} from "@/infrastructure/updates/update-service";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

const FOREGROUND_CHECK_COOLDOWN_MS = 15 * 60 * 1000;
const INITIAL_CHECK_DELAY_MS = 1_200;

export function UpdateBootstrap() {
  const { language } = useAppPreferences();
  const checkingRef = useRef(false);
  const dismissedForSessionRef = useRef(false);
  const lastCheckAtRef = useRef(0);
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
      Alert.alert(
        vi ? "Có bản cập nhật mới" : "Update available",
        vi
          ? "AI-PM có bản cập nhật mới. Bạn có thể cập nhật ngay mà không cần cài lại ứng dụng."
          : "A new AI-PM update is ready. You can install it without reinstalling the app.",
        [
          { text: vi ? "Để sau" : "Later", style: "cancel" },
          {
            text: vi ? "Cập nhật ngay" : "Update now",
            onPress: () => {
              void downloadAndApplyOtaUpdate().catch((error) => {
                Alert.alert(
                  vi ? "Không thể cập nhật" : "Update failed",
                  error instanceof Error ? error.message : String(error),
                );
              });
            },
          },
        ],
      );
    } catch {
      // OTA checks are best-effort. A network/update service failure should
      // never block the user from opening or continuing to use the app.
    } finally {
      checkingRef.current = false;
    }
  }, [vi]);

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

  return null;
}
