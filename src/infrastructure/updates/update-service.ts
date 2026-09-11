import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type OtaUpdateCheck =
  { status: "available" } | { status: "up-to-date" } | { status: "disabled" };

export type OtaSupportReason =
  "web" | "development-build" | "updates-disabled" | null;

export type OtaApplyPhase = "idle" | "downloading" | "restarting";

export type OtaReloadScreenAppearance = {
  backgroundColor: string;
  spinnerColor: string;
};

type OtaApplyOptions = {
  reloadScreenAppearance?: OtaReloadScreenAppearance;
};

let otaApplyPhase: OtaApplyPhase = "idle";
const otaApplyPhaseListeners = new Set<() => void>();

function setOtaApplyPhase(phase: OtaApplyPhase) {
  if (otaApplyPhase === phase) return;
  otaApplyPhase = phase;
  for (const listener of otaApplyPhaseListeners) listener();
}

export function getOtaApplyPhase() {
  return otaApplyPhase;
}

export function subscribeOtaApplyPhase(listener: () => void) {
  otaApplyPhaseListeners.add(listener);
  return () => otaApplyPhaseListeners.delete(listener);
}

function waitForNextRenderFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function getOtaSupportReason(): OtaSupportReason {
  if (Platform.OS === "web") return "web";
  if (__DEV__) return "development-build";
  if (!Updates.isEnabled) return "updates-disabled";
  return null;
}

export function isOtaUpdateSupported() {
  return getOtaSupportReason() === null;
}

export async function checkForOtaUpdate(): Promise<OtaUpdateCheck> {
  if (!isOtaUpdateSupported()) return { status: "disabled" };

  try {
    const result = await Updates.checkForUpdateAsync();
    return result.isAvailable
      ? { status: "available" }
      : { status: "up-to-date" };
  } catch (error) {
    const nativeCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    const message =
      error instanceof Error ? error.message : String(error ?? "");

    if (nativeCode === "ERR_UPDATES_CHECK") {
      throw new Error(
        message && message !== "undefined reason"
          ? `Expo Updates không thể kiểm tra OTA: ${message}`
          : "Expo Updates không thể kiểm tra OTA từ bản cài hiện tại. Hãy cài lại bản Release được build với đúng channel/runtime rồi thử lại.",
      );
    }

    throw error;
  }
}

export async function downloadAndApplyOtaUpdate(options: OtaApplyOptions = {}) {
  if (!isOtaUpdateSupported()) return;

  setOtaApplyPhase("downloading");
  await waitForNextRenderFrame();

  try {
    await Updates.fetchUpdateAsync();
    setOtaApplyPhase("restarting");
    await waitForNextRenderFrame();

    const appearance = options.reloadScreenAppearance;
    await Updates.reloadAsync({
      reloadScreenOptions: {
        backgroundColor: appearance?.backgroundColor,
        fade: true,
        spinner: {
          enabled: true,
          color: appearance?.spinnerColor,
          size: "large",
        },
      },
    });
  } catch (error) {
    setOtaApplyPhase("idle");
    throw error;
  }
}

export function getOtaUpdateInfo() {
  const manifest = Updates.manifest as Record<string, unknown> | null;
  const metadata =
    manifest &&
    typeof manifest.metadata === "object" &&
    manifest.metadata !== null
      ? (manifest.metadata as Record<string, unknown>)
      : {};

  return {
    supported: isOtaUpdateSupported(),
    supportReason: getOtaSupportReason(),
    appVersion: Constants.expoConfig?.version ?? "—",
    channel:
      Updates.channel ??
      (typeof Constants.expoConfig?.extra?.updateChannel === "string"
        ? Constants.expoConfig.extra.updateChannel
        : "—"),
    runtimeVersion: Updates.runtimeVersion ?? "—",
    updateId: Updates.updateId ?? null,
    createdAt: Updates.createdAt ?? null,
    releaseNotes:
      typeof metadata.updateMessage === "string"
        ? metadata.updateMessage
        : null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
