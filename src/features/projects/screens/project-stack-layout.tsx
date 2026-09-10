import { Stack } from "expo-router";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

export default function ProjectStackLayout() {
  const { theme: ui } = useAppPreferences();

  return (
    <Stack
      initialRouteName="(workspace)"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ui.colors.bg },
      }}
    />
  );
}
