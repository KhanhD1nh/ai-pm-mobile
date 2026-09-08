import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "ai_pm_biometric_lock";
const listeners = new Set<(enabled: boolean) => void>();

export async function isBiometricLockEnabled() {
  if (Platform.OS === "web") return false;
  return (await SecureStore.getItemAsync(KEY)) === "1";
}

export async function setBiometricLockEnabled(enabled: boolean) {
  if (Platform.OS === "web") {
    if (enabled)
      throw new Error("Khóa sinh trắc học không được hỗ trợ trên web");
    listeners.forEach((listener) => listener(false));
    return;
  }

  if (enabled) {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled)
      throw new Error("Thiết bị chưa cấu hình sinh trắc học");
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Bật khóa sinh trắc học cho AI-PM",
      cancelLabel: "Hủy",
    });
    if (!result.success) throw new Error("Xác thực sinh trắc học thất bại");
  }
  await SecureStore.setItemAsync(KEY, enabled ? "1" : "0");
  listeners.forEach((listener) => listener(enabled));
}

export function subscribeBiometricLock(listener: (enabled: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function authenticateForAppUnlock() {
  if (Platform.OS === "web") return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Mở khóa AI-PM",
    cancelLabel: "Hủy",
    disableDeviceFallback: false,
  });
  return result.success;
}
