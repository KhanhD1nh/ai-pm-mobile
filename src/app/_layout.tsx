import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '@/contexts/app-providers';
import { NotificationBootstrap } from '@/components/notification-bootstrap';
import { RealtimeBootstrap } from '@/components/realtime-bootstrap';
import { AppLockBootstrap } from '@/components/app-lock-bootstrap';

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
