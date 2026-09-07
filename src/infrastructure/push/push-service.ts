import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { env } from '@/config/env';
import { pushApi } from '@/infrastructure/push/push-api';
import { request } from '@/infrastructure/networking/api-client';

function assertRemotePushAvailable() {
  if (Platform.OS === 'web') throw new Error('Push notifications chưa được hỗ trợ trên web');
  if (Constants.appOwnership === 'expo') throw new Error('Push notifications cần development build; Expo Go không hỗ trợ remote notifications trên Android');
}

async function getNotifications() {
  assertRemotePushAvailable();
  // Expo Go throws while evaluating expo-notifications on Android; load only after the runtime guard.
  const Notifications = await import('expo-notifications');
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
  if (!Device.isDevice) throw new Error('Push notifications cần thiết bị thật');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AI-PM',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') throw new Error('Quyền thông báo chưa được cấp');
  const projectId = env.easProjectId ?? Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Thiếu EAS projectId để đăng ký Expo Push Token');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return pushApi.registerDevice({
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    pushProvider: 'EXPO',
    pushToken: token,
    deviceName: Device.deviceName ?? null,
    appVersion: Constants.expoConfig?.version ?? null,
  });
}

export async function syncAppBadge() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return;

  try {
    const Notifications = await getNotifications();
    const { unread } = await request<{ unread: number }>('/notifications/unread-count');
    await Notifications.setBadgeCountAsync(unread);
  } catch {
    // Badge sync is best-effort.
  }
}

export function routeFromNotificationData(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.route === 'string' && data.route.startsWith('/')) return data.route;
  const identifier = typeof data.issueIdentifier === 'string' ? data.issueIdentifier : typeof data.identifier === 'string' ? data.identifier : null;
  if (identifier) return `/issue/${encodeURIComponent(identifier)}`;
  const projectId = typeof data.projectId === 'string' ? data.projectId : null;
  if (projectId) return `/project/${projectId}`;
  return null;
}
