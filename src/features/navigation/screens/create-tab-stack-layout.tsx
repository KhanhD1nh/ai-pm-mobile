import { Stack } from 'expo-router';

export default function CreateTabStackLayout() {
  return <Stack initialRouteName="quick-create" screenOptions={{ headerShown: false }} />;
}
