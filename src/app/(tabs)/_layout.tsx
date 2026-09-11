import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, Tabs, router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { issuesApi, issueKeys } from "@/features/issues/public";
import {
  notificationsApi,
  notificationKeys,
} from "@/features/notifications/public";
import { projectsApi, projectKeys } from "@/features/projects/public";
import { useAuth } from "@/providers/auth-provider";
import { MotionPressable } from "@/shared/components/ui/motion";
import { LoadingScreen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

function AndroidTabIcon({
  ui,
  focused,
  icon,
  iconActive,
}: {
  ui: AppTheme;
  focused: boolean;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconActive: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View style={[styles.tabIconShell, focused && styles.tabIconShellActive]}>
      <Ionicons
        accessible={false}
        name={focused ? iconActive : icon}
        size={24}
        color={focused ? ui.colors.onPrimaryContainer : ui.colors.textSecondary}
      />
    </View>
  );
}

function AndroidCreateTabButton({
  ui,
  label,
  accessibilityLabel,
}: {
  ui: AppTheme;
  label: string;
  accessibilityLabel: string;
}) {
  const styles = useMemo(() => createStyles(ui), [ui]);

  return (
    <View style={styles.createSlot}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="android-create-fab"
        android_ripple={{ color: ui.colors.accentSoft, borderless: false }}
        onPress={() => router.push("/quick-create")}
        style={styles.createFab}
      >
        <Ionicons
          accessible={false}
          name="add"
          size={30}
          color={ui.colors.inverseText}
        />
      </MotionPressable>
      <Text style={styles.createLabel}>{label}</Text>
    </View>
  );
}

function AndroidTabs({
  ui,
  homeLabel,
  projectsLabel,
  createLabel,
  inboxLabel,
  settingsLabel,
}: {
  ui: AppTheme;
  homeLabel: string;
  projectsLabel: string;
  createLabel: string;
  inboxLabel: string;
  settingsLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ui), [ui]);

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ui.colors.bg },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: ui.colors.accentStrong,
        tabBarInactiveTintColor: ui.colors.textSecondary,
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIconLayout,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: homeLabel,
          tabBarAccessibilityLabel: homeLabel,
          tabBarIcon: ({ focused }) => (
            <AndroidTabIcon
              ui={ui}
              focused={focused}
              icon="home-outline"
              iconActive="home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(projects)"
        options={{
          title: projectsLabel,
          tabBarAccessibilityLabel: projectsLabel,
          tabBarIcon: ({ focused }) => (
            <AndroidTabIcon
              ui={ui}
              focused={focused}
              icon="folder-outline"
              iconActive="folder"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: createLabel,
          tabBarLabel: () => null,
          tabBarButton: () => (
            <AndroidCreateTabButton
              ui={ui}
              label={createLabel}
              accessibilityLabel={
                createLabel === "Tạo" ? "Tạo công việc" : "Create task"
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(inbox)"
        options={{
          title: inboxLabel,
          tabBarAccessibilityLabel: inboxLabel,
          tabBarIcon: ({ focused }) => (
            <AndroidTabIcon
              ui={ui}
              focused={focused}
              icon="chatbubble-outline"
              iconActive="chatbubble"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: settingsLabel,
          tabBarAccessibilityLabel: settingsLabel,
          tabBarIcon: ({ focused }) => (
            <AndroidTabIcon
              ui={ui}
              focused={focused}
              icon="settings-outline"
              iconActive="settings"
            />
          ),
        }}
      />
    </Tabs>
  );
}

function IosTabs({
  ui,
  language,
  t,
}: {
  ui: AppTheme;
  language: "vi" | "en";
  t: ReturnType<typeof useAppPreferences>["t"];
}) {
  return (
    <NativeTabs
      tintColor={ui.colors.accentStrong}
      rippleColor={ui.colors.accentSoft}
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

  const settingsLabel = language === "vi" ? "Cài đặt" : "Settings";

  if (Platform.OS === "android") {
    return (
      <AndroidTabs
        ui={ui}
        homeLabel={t("nav.home")}
        projectsLabel={t("nav.projects")}
        createLabel={language === "vi" ? "Tạo" : "Create"}
        inboxLabel={t("nav.inbox")}
        settingsLabel={settingsLabel}
      />
    );
  }

  return <IosTabs ui={ui} language={language} t={t} />;
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    tabBar: {
      paddingTop: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
      backgroundColor: ui.colors.surface,
      elevation: 0,
      shadowColor: ui.colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -3 },
    },
    tabItem: {
      height: 64,
      paddingTop: 6,
      paddingBottom: 6,
    },
    tabIconLayout: {
      width: 56,
      height: 32,
      marginTop: 0,
      marginBottom: 0,
    },
    tabLabel: {
      height: 16,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
      marginTop: 4,
      marginBottom: 0,
    },
    tabIconShell: {
      width: 56,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    tabIconShellActive: { backgroundColor: ui.colors.primaryContainer },
    createSlot: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    createFab: {
      width: 56,
      height: 56,
      borderRadius: 18,
      marginTop: -22,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: ui.colors.accentStrong,
      shadowColor: ui.colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 8,
    },
    createLabel: {
      color: ui.colors.textSecondary,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "600",
      marginTop: 3,
    },
  });
