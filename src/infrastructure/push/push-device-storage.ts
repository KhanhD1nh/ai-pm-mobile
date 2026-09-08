import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_PUSH_DEVICE_ID_KEY = "ai_pm_current_push_device_id";

export async function getCurrentPushDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(CURRENT_PUSH_DEVICE_ID_KEY);
}

export async function setCurrentPushDeviceId(deviceId: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_PUSH_DEVICE_ID_KEY, deviceId);
}
