import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { env } from "@/config/env";
import { pushApi } from "@/infrastructure/push/push-api";
import { setCurrentPushDeviceId } from "@/infrastructure/push/push-device-storage";
import { request } from "@/infrastructure/networking/api-client";
import type { NotificationDevice } from "@/shared/contracts";

export type RemotePushSupport = {
  supported: boolean;
  reason: "web" | "expo-go" | null;
};

export function getRemotePushSupport(): RemotePushSupport {
  if (Platform.OS === "web") return { supported: false, reason: "web" };
  if (Constants.appOwnership === "expo")
    return { supported: false, reason: "expo-go" };
  return { supported: true, reason: null };
}

function assertRemotePushAvailable() {
  const support = getRemotePushSupport();
  if (support.supported) return;
  if (Platform.OS === "web")
    throw new Error("Push notifications chưa được hỗ trợ trên web");
  if (support.reason === "expo-go")
    throw new Error(
      "Push notifications cần development build; Expo Go không hỗ trợ remote notifications trên Android",
    );
}

async function getNotifications() {
  assertRemotePushAvailable();
  // Expo Go throws while evaluating expo-notifications on Android; load only after the runtime guard.
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
  return Notifications;
}
export async function registerForPushNotifications() {
  const Notifications = await getNotifications();
  if (!Device.isDevice) throw new Error("Push notifications cần thiết bị thật");
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "AI-PM",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted")
    status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") throw new Error("Quyền thông báo chưa được cấp");
  const projectId =
    env.easProjectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId)
    throw new Error("Thiếu EAS projectId để đăng ký Expo Push Token");
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "");
    if (
      Platform.OS === "ios" &&
      /aps-environment|remote notifications|push notification entitlement/i.test(
        message,
      )
    ) {
      throw new Error(
        "IPA hiện tại chưa được ký bằng provisioning profile có Push Notifications (aps-environment). Hãy ký lại bằng App ID explicit có APNs rồi cài lại app.",
      );
    }
    throw error;
  }
  const device = await pushApi.registerDevice({
    platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
    pushProvider: "EXPO",
    pushToken: token,
    deviceName: Device.deviceName ?? null,
    appVersion: Constants.expoConfig?.version ?? null,
  });
  await setCurrentPushDeviceId(device.id);
  return device;
}

export function resolveCurrentPushDevice(
  devices: NotificationDevice[],
  rememberedDeviceId: string | null,
): NotificationDevice | null {
  if (rememberedDeviceId) {
    const remembered = devices.find(
      (device) => device.id === rememberedDeviceId,
    );
    if (remembered) return remembered;
  }

  const platform =
    Platform.OS === "ios"
      ? "IOS"
      : Platform.OS === "android"
        ? "ANDROID"
        : null;
  if (!platform) return null;

  const samePlatform = devices.filter((device) => device.platform === platform);
  if (Device.deviceName) {
    const sameName = samePlatform.filter(
      (device) => device.device_name === Device.deviceName,
    );
    if (sameName.length === 1) return sameName[0];
  }

  return samePlatform.length === 1 ? samePlatform[0] : null;
}

export async function syncAppBadge() {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") return;

  try {
    const Notifications = await getNotifications();
    const { unread } = await request<{ unread: number }>(
      "/notifications/unread-count",
    );
    await Notifications.setBadgeCountAsync(unread);
  } catch {
    // Badge sync is best-effort.
  }
}

export function routeFromNotificationData(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data) return null;
  if (typeof data.route === "string" && data.route.startsWith("/"))
    return data.route;
  const identifier =
    typeof data.issueIdentifier === "string"
      ? data.issueIdentifier
      : typeof data.identifier === "string"
        ? data.identifier
        : null;
  if (identifier) return `/issue/${encodeURIComponent(identifier)}`;
  const projectId = typeof data.projectId === "string" ? data.projectId : null;
  if (projectId) return `/project/${projectId}`;
  return null;
}
