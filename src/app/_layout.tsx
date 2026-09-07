import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '@/providers/app-providers';
import { NotificationBootstrap } from '@/providers/runtime/notification-bootstrap';
import { RealtimeBootstrap } from '@/providers/runtime/realtime-bootstrap';
import { AppLockBootstrap } from '@/providers/runtime/app-lock-bootstrap';
import { DeepLinkBootstrap } from '@/providers/runtime/deep-link-bootstrap';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';

function AppShell() {
  const { resolvedTheme, theme } = useAppPreferences();
  const baseNavigationTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.colors.accentStrong,
      background: theme.colors.bg,
      card: theme.colors.bg,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar
        barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
      />
      <NotificationBootstrap />
      <DeepLinkBootstrap />
      <RealtimeBootstrap />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          gestureEnabled: true,
          fullScreenGestureEnabled: Platform.OS === 'ios',
          animationMatchesGesture: Platform.OS === 'ios',
          animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
      </Stack>
      <AppLockBootstrap />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </SafeAreaProvider>
  );
}
