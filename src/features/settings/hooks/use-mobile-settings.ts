import { useEffect, useMemo, useState } from "react";
import * as Updates from "expo-updates";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/features/notifications/public";
import { pushApi } from "@/infrastructure/push/push-api";
import {
  getCurrentPushDeviceId,
  setCurrentPushDeviceId,
} from "@/infrastructure/push/push-device-storage";
import {
  getRemotePushSupport,
  registerForPushNotifications,
  resolveCurrentPushDevice,
  syncAppBadge,
} from "@/infrastructure/push/push-service";
import {
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from "@/infrastructure/security/biometric-service";
import {
  clearOfflineMutationQueue,
  flushOfflineMutationQueue,
  getOfflineQueueStats,
  retryOfflineMutationFailures,
  subscribeOfflineQueue,
  type OfflineQueueStats,
} from "@/infrastructure/persistence/offline-mutation-queue";
import { useAuth } from "@/providers/auth-provider";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import {
  checkForOtaUpdate,
  downloadAndApplyOtaUpdate,
  getOtaUpdateInfo,
} from "@/infrastructure/updates/update-service";

export function useMobileSettings() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  const { theme: ui } = useAppPreferences();
  const otaState = Updates.useUpdates();
  const [busy, setBusy] = useState(false);
  const [currentPushDeviceId, setCurrentPushDeviceIdState] = useState<
    string | null
  >(null);
  const [biometric, setBiometric] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateOperation, setUpdateOperation] = useState<
    "idle" | "checking" | "downloading"
  >("idle");
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "available" | "up-to-date" | "disabled"
  >("idle");
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueStats>({
    total: 0,
    queued: 0,
    conflicts: 0,
    failed: 0,
    flushed: 0,
  });
  const devices = useQuery({
    queryKey: notificationKeys.devices(orgId),
    queryFn: pushApi.devices,
    enabled: !!orgId,
  });
  const currentPushDevice = useMemo(
    () => resolveCurrentPushDevice(devices.data ?? [], currentPushDeviceId),
    [currentPushDeviceId, devices.data],
  );
  const pushEnabled = currentPushDevice?.enabled ?? false;
  const pushSupport = getRemotePushSupport();

  useEffect(() => {
    let active = true;
    void getCurrentPushDeviceId().then((deviceId) => {
      if (active) setCurrentPushDeviceIdState(deviceId);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (currentPushDeviceId || !currentPushDevice) return;
    void setCurrentPushDeviceId(currentPushDevice.id);
  }, [currentPushDevice, currentPushDeviceId]);

  useEffect(() => {
    void isBiometricLockEnabled().then(setBiometric);
  }, []);

  useEffect(() => {
    const refresh = () => void getOfflineQueueStats().then(setOfflineQueue);
    refresh();
    return subscribeOfflineQueue(refresh);
  }, []);

  const enablePush = async () => {
    setBusy(true);
    try {
      const device = await registerForPushNotifications();
      setCurrentPushDeviceIdState(device.id);
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.devices(orgId),
      });
      await syncAppBadge();
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    if (!currentPushDevice) return;
    setBusy(true);
    try {
      await pushApi.disableDevice(currentPushDevice.id);
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.devices(orgId),
      });
    } finally {
      setBusy(false);
    }
  };

  const disableDevice = async (deviceId: string) => {
    await pushApi.disableDevice(deviceId);
    await queryClient.invalidateQueries({
      queryKey: notificationKeys.devices(orgId),
    });
  };

  const toggleBiometric = async (enabled: boolean) => {
    await setBiometricLockEnabled(enabled);
    setBiometric(enabled);
  };

  const checkUpdate = async () => {
    setUpdateBusy(true);
    setUpdateOperation("checking");
    try {
      const result = await checkForOtaUpdate();
      setUpdateStatus(result.status);
      return result;
    } finally {
      setUpdateBusy(false);
      setUpdateOperation("idle");
    }
  };

  const applyUpdate = async () => {
    setUpdateBusy(true);
    setUpdateOperation("downloading");
    try {
      await downloadAndApplyOtaUpdate({
        reloadScreenAppearance: {
          backgroundColor: ui.colors.bg,
          spinnerColor: ui.colors.accentStrong,
        },
      });
    } finally {
      setUpdateBusy(false);
      setUpdateOperation("idle");
    }
  };

  const updateActivity = otaState.isRestarting
    ? "restarting"
    : otaState.isDownloading
      ? "downloading"
      : otaState.isChecking
        ? "checking"
        : updateOperation;
  const updateProgress =
    updateActivity === "downloading" &&
    typeof otaState.downloadProgress === "number"
      ? Math.min(1, Math.max(0, otaState.downloadProgress))
      : null;

  const syncOfflineQueue = async () => {
    const result = await flushOfflineMutationQueue();
    setOfflineQueue(result);
    if (result.flushed > 0) await queryClient.invalidateQueries();
    return result;
  };

  const retryOfflineQueue = async () => {
    await retryOfflineMutationFailures();
    return syncOfflineQueue();
  };

  const clearOfflineQueue = async () => {
    await clearOfflineMutationQueue();
    setOfflineQueue({
      total: 0,
      queued: 0,
      conflicts: 0,
      failed: 0,
      flushed: 0,
    });
  };

  return {
    devices,
    busy,
    pushEnabled,
    pushSupport,
    biometric,
    enablePush,
    disablePush,
    disableDevice,
    toggleBiometric,
    updateBusy,
    updateActivity,
    updateProgress,
    updateStatus,
    updateInfo: getOtaUpdateInfo(),
    checkUpdate,
    applyUpdate,
    offlineQueue,
    syncOfflineQueue,
    retryOfflineQueue,
    clearOfflineQueue,
  };
}
