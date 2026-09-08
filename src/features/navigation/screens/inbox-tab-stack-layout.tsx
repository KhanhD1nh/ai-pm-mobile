import { Stack } from "expo-router";

export default function InboxTabStackLayout() {
  return (
    <Stack initialRouteName="inbox" screenOptions={{ headerShown: false }} />
  );
}
