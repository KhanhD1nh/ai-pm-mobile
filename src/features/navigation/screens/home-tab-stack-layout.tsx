import { Stack } from "expo-router";

export default function HomeTabStackLayout() {
  return (
    <Stack initialRouteName="home" screenOptions={{ headerShown: false }} />
  );
}
