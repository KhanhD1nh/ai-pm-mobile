import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { LoadingScreen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';

export default function TabsLayout() {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#0f151d', borderTopColor: '#202a35' }, tabBarActiveTintColor: '#4da3ff', tabBarInactiveTintColor: '#778592' }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="my-work" options={{ title: 'My Work', tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
