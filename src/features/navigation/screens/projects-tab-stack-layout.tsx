import { Stack } from "expo-router";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

export default function ProjectsTabStackLayout() {
  const { theme: ui } = useAppPreferences();

  return (
    <Stack
      initialRouteName="projects"
      screenOptions={{
        headerShown: false,
        // Keep the native stack container on the exact app background while the
        // Projects tab is detached/reattached by UITabBarController. Without this,
        // a default navigation-theme frame can show between cached stack frames.
        contentStyle: { backgroundColor: ui.colors.bg },
      }}
    />
  );
}
