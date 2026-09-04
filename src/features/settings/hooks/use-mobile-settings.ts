import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/features/notifications/public';
import { pushApi } from '@/infrastructure/push/push-api';
import { registerForPushNotifications, syncAppBadge } from '@/infrastructure/push/push-service';
import { isBiometricLockEnabled, setBiometricLockEnabled } from '@/infrastructure/security/biometric-service';

export function useMobileSettings() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const devices = useQuery({ queryKey: notificationKeys.devices(), queryFn: pushApi.devices });

  useEffect(() => {
    void isBiometricLockEnabled().then(setBiometric);
  }, []);

  const enablePush = async () => {
    setBusy(true);
    try {
      await registerForPushNotifications();
      await queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
      await syncAppBadge();
    } finally {
      setBusy(false);
    }
  };

  const disableDevice = async (deviceId: string) => {
    await pushApi.disableDevice(deviceId);
    await queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
  };

  const toggleBiometric = async (enabled: boolean) => {
    await setBiometricLockEnabled(enabled);
    setBiometric(enabled);
  };

  return { devices, busy, biometric, enablePush, disableDevice, toggleBiometric };
}
