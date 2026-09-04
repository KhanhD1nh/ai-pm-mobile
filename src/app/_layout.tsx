import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '@/providers/app-providers';
import { NotificationBootstrap } from '@/providers/runtime/notification-bootstrap';
import { RealtimeBootstrap } from '@/providers/runtime/realtime-bootstrap';
import { AppLockBootstrap } from '@/providers/runtime/app-lock-bootstrap';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="light" />
        <NotificationBootstrap />
        <RealtimeBootstrap />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b0f14' } }} />
        <AppLockBootstrap />
      </AppProviders>
    </SafeAreaProvider>
  );
}
