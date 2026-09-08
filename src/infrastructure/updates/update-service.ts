import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type OtaUpdateCheck =
  { status: "available" } | { status: "up-to-date" } | { status: "disabled" };

export type OtaSupportReason =
  "web" | "development-build" | "updates-disabled" | null;

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

  const result = await Updates.checkForUpdateAsync();
  return result.isAvailable
    ? { status: "available" }
    : { status: "up-to-date" };
}

export async function downloadAndApplyOtaUpdate() {
  if (!isOtaUpdateSupported()) return;
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
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
    channel: Updates.channel ?? "—",
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
