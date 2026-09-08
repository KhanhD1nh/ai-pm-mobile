import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { issuesApi, issueKeys } from "@/features/issues/public";
import {
  notificationsApi,
  notificationKeys,
} from "@/features/notifications/public";
import { projectsApi, projectKeys } from "@/features/projects/public";
import { useAuth } from "@/providers/auth-provider";
import { LoadingScreen } from "@/shared/components/ui/screen";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

export default function TabsLayout() {
  const { ready, user, orgId } = useAuth();
  const { theme: ui, language, t } = useAppPreferences();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ready || !user || !orgId) return;

    // Warm the primary tab data in the background. React Query deduplicates these
    // requests with any screen query that is already in flight, so first entry into
    // Projects/Inbox/My Work can render from cache instead of showing an empty shell.
    void Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: projectKeys.list(orgId),
        queryFn: projectsApi.list,
      }),
      queryClient.prefetchQuery({
        queryKey: issueKeys.myWork(orgId, user.id),
        queryFn: () =>
          issuesApi.list({
            assigneeId: user.id,
            limit: 100,
            sortBy: "updated_at",
            sortOrder: "desc",
          }),
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: notificationKeys.list(orgId, "ALL"),
        queryFn: ({ pageParam }) =>
          notificationsApi.list({
            filter: "ALL",
            limit: 40,
            offset: pageParam,
          }),
        initialPageParam: 0,
      }),
      queryClient.prefetchQuery({
        queryKey: notificationKeys.unread(orgId),
        queryFn: notificationsApi.unreadCount,
      }),
    ]);
  }, [orgId, queryClient, ready, user]);

  if (!ready) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <NativeTabs
      tintColor={ui.colors.accentStrong}
      iconColor={{
        default: ui.colors.textSecondary,
        selected: ui.colors.accentStrong,
      }}
      minimizeBehavior="never"
      unstable_nativeProps={{ rejectStaleNavStateUpdates: true }}
    >
      <NativeTabs.Trigger
        name="(home)"
        testID="native-tab-home"
        accessibilityLabel={t("nav.home")}
        contentStyle={{ backgroundColor: ui.colors.bg }}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home" }}
        />
        <NativeTabs.Trigger.Label hidden>
          {t("nav.home")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(projects)"
        testID="native-tab-projects"
        accessibilityLabel={t("nav.projects")}
        contentStyle={{ backgroundColor: ui.colors.bg }}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "folder", selected: "folder.fill" }}
          md={{ default: "folder", selected: "folder" }}
        />
        <NativeTabs.Trigger.Label hidden>
          {t("nav.projects")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(create)"
        testID="native-tab-create"
        accessibilityLabel={language === "vi" ? "Tạo công việc" : "Create task"}
        contentStyle={{ backgroundColor: ui.colors.bg }}
      >
        <NativeTabs.Trigger.Icon sf="plus" md="add" />
        <NativeTabs.Trigger.Label hidden>
          {language === "vi" ? "Tạo" : "Create"}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(inbox)"
        testID="native-tab-inbox"
        accessibilityLabel={t("nav.inbox")}
        contentStyle={{ backgroundColor: ui.colors.bg }}
      >
        <NativeTabs.Trigger.Icon
          sf={{ default: "bubble.left", selected: "bubble.left.fill" }}
          md={{ default: "chat_bubble_outline", selected: "chat_bubble" }}
        />
        <NativeTabs.Trigger.Label hidden>
          {t("nav.inbox")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(more)"
        testID="native-tab-more"
        accessibilityLabel={t("nav.more")}
        contentStyle={{ backgroundColor: ui.colors.bg }}
      >
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md={{ default: "account_circle", selected: "account_circle" }}
        />
        <NativeTabs.Trigger.Label hidden>
          {t("nav.more")}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
