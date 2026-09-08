import { Stack } from "expo-router";

export default function MoreTabStackLayout() {
  return (
    <Stack initialRouteName="more" screenOptions={{ headerShown: false }} />
  );
}
