import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/features/notifications/public";
import { pushApi } from "@/infrastructure/push/push-api";
import {
  registerForPushNotifications,
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
import {
  checkForOtaUpdate,
  downloadAndApplyOtaUpdate,
  getOtaUpdateInfo,
} from "@/infrastructure/updates/update-service";

export function useMobileSettings() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  const [busy, setBusy] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
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
      await registerForPushNotifications();
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.devices(orgId),
      });
      await syncAppBadge();
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
    try {
      const result = await checkForOtaUpdate();
      setUpdateStatus(result.status);
      return result;
    } finally {
      setUpdateBusy(false);
    }
  };

  const applyUpdate = async () => {
    setUpdateBusy(true);
    try {
      await downloadAndApplyOtaUpdate();
    } finally {
      setUpdateBusy(false);
    }
  };

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
    biometric,
    enablePush,
    disableDevice,
    toggleBiometric,
    updateBusy,
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
