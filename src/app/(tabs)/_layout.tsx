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

function AndroidTabItem({
  ui,
  focused,
  label,
  accessibilityLabel,
  icon,
  iconActive,
  create = false,
  onPress,
  onLongPress,
}: {
  ui: AppTheme;
  focused: boolean;
  label: string;
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconActive: React.ComponentProps<typeof Ionicons>["name"];
  create?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const styles = useMemo(() => createStyles(ui), [ui]);
  const iconColor = focused
    ? ui.colors.text
    : create
      ? ui.colors.accentStrong
      : ui.colors.textSecondary;

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={create ? undefined : { selected: focused }}
      testID={create ? "android-create-action" : undefined}
      android_ripple={{
        color: create ? ui.colors.accentSoft : "transparent",
        borderless: true,
        foreground: true,
        radius: 28,
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.androidTabItem}
    >
      <View
        style={[
          styles.androidTabIconContainer,
          focused && !create && styles.androidTabIconContainerActive,
        ]}
      >
        <Ionicons
          accessible={false}
          name={focused ? iconActive : icon}
          size={22}
          color={iconColor}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.androidTabLabel,
          focused && !create && styles.androidTabLabelActive,
          create && styles.androidCreateLabel,
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
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
      tabBar={({ state, descriptors, navigation }) => (
        <View
          style={[
            styles.androidTabBarArea,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <View style={styles.androidTabBar}>
            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const options = descriptors[route.key].options;
              const label =
                typeof options.title === "string" ? options.title : route.name;
              const accessibilityLabel =
                typeof options.tabBarAccessibilityLabel === "string"
                  ? options.tabBarAccessibilityLabel
                  : label;
              const create = route.name === "(create)";
              const icons: [
                React.ComponentProps<typeof Ionicons>["name"],
                React.ComponentProps<typeof Ionicons>["name"],
              ] =
                route.name === "(home)"
                  ? ["home-outline", "home"]
                  : route.name === "(projects)"
                    ? ["folder-outline", "folder"]
                    : route.name === "(inbox)"
                      ? ["chatbubble-outline", "chatbubble"]
                      : route.name === "(more)"
                        ? ["settings-outline", "settings"]
                        : ["add", "add"];

              const onPress = () => {
                if (create) {
                  router.push("/quick-create");
                  return;
                }

                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = create
                ? undefined
                : () =>
                    navigation.emit({
                      type: "tabLongPress",
                      target: route.key,
                    });

              return (
                <AndroidTabItem
                  key={route.key}
                  ui={ui}
                  focused={focused}
                  label={label}
                  accessibilityLabel={accessibilityLabel}
                  icon={icons[0]}
                  iconActive={icons[1]}
                  create={create}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}
          </View>
        </View>
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: ui.colors.bg },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: homeLabel,
          tabBarAccessibilityLabel: homeLabel,
        }}
      />
      <Tabs.Screen
        name="(projects)"
        options={{
          title: projectsLabel,
          tabBarAccessibilityLabel: projectsLabel,
        }}
      />
      <Tabs.Screen
        name="(create)"
        options={{
          title: createLabel,
          tabBarAccessibilityLabel:
            createLabel === "Tạo" ? "Tạo công việc" : "Create task",
        }}
      />
      <Tabs.Screen
        name="(inbox)"
        options={{
          title: inboxLabel,
          tabBarAccessibilityLabel: inboxLabel,
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: settingsLabel,
          tabBarAccessibilityLabel: settingsLabel,
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
    androidTabBarArea: {
      paddingTop: 8,
      paddingHorizontal: 14,
      backgroundColor: ui.colors.bg,
    },
    androidTabBar: {
      position: "relative",
      height: 66,
      paddingHorizontal: 6,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      borderRadius: 22,
      backgroundColor: ui.colors.surface,
      overflow: "hidden",
      shadowColor: ui.colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    androidTabItem: {
      flex: 1,
      minWidth: 0,
      height: 56,
      paddingHorizontal: 1,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      overflow: "hidden",
    },
    androidTabIconContainer: {
      minWidth: 38,
      height: 30,
      paddingHorizontal: 8,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    androidTabIconContainerActive: {
      backgroundColor: ui.colors.surfaceContainerHigh,
    },
    androidTabLabel: {
      maxWidth: "100%",
      color: ui.colors.textSecondary,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "500",
      textAlign: "center",
    },
    androidTabLabelActive: {
      color: ui.colors.text,
      fontWeight: "600",
    },
    androidCreateLabel: {
      color: ui.colors.accentStrong,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "600",
    },
  });
