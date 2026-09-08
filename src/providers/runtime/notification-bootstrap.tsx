import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import type { NotificationResponse } from "expo-notifications";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import {
  notificationsApi,
  notificationKeys,
} from "@/features/notifications/public";
import { useAuth } from "@/providers/auth-provider";
import {
  routeFromNotificationData,
  syncAppBadge,
} from "@/infrastructure/push/push-service";

export function NotificationBootstrap() {
  const { ready, user, orgId, selectOrganization } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const handledResponseIds = useRef(new Set<string>());

  useEffect(() => {
    if (!ready || !userId) return;
    if (Platform.OS === "web" || Constants.appOwnership === "expo") return;

    let received: { remove(): void } | undefined;
    let opened: { remove(): void } | undefined;
    let active = true;
    void syncAppBadge();

    const handleOpen = async (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      const targetOrgId = typeof data.orgId === "string" ? data.orgId : null;
      if (targetOrgId && targetOrgId !== orgId) {
        await selectOrganization(targetOrgId);
      }
      const activeOrgId = targetOrgId ?? orgId;
      const notificationId =
        typeof data.notificationId === "string" ? data.notificationId : null;
      if (notificationId) {
        try {
          await notificationsApi.markRead(notificationId);
        } catch {
          /* navigate even if read-sync fails */
        }
        await Promise.all([
          qc.invalidateQueries({
            queryKey: notificationKeys.lists(activeOrgId),
          }),
          qc.invalidateQueries({
            queryKey: notificationKeys.unread(activeOrgId),
          }),
        ]);
        void syncAppBadge();
      }
      const route = routeFromNotificationData(data);
      if (route) router.push(route as never);
    };

    // Expo Go throws while evaluating expo-notifications on Android; load only after the runtime guard.
    void import("expo-notifications").then((Notifications) => {
      if (!active) return;
      received = Notifications.addNotificationReceivedListener(() => {
        void qc.invalidateQueries({ queryKey: notificationKeys.lists(orgId) });
        void qc.invalidateQueries({ queryKey: notificationKeys.unread(orgId) });
        void syncAppBadge();
      });

      const handleResponse = (response: NotificationResponse) => {
        const responseId = response.notification.request.identifier;
        if (handledResponseIds.current.has(responseId)) return;
        handledResponseIds.current.add(responseId);
        void handleOpen(
          response.notification.request.content.data as
            Record<string, unknown> | undefined,
        );
      };

      opened =
        Notifications.addNotificationResponseReceivedListener(handleResponse);

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        setTimeout(() => {
          handleResponse(response);
        }, 150);
      });
    });

    return () => {
      active = false;
      received?.remove();
      opened?.remove();
    };
  }, [ready, userId, orgId, selectOrganization, qc]);

  return null;
}
