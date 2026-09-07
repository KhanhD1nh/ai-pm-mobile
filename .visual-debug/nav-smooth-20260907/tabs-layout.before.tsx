import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, Tabs } from 'expo-router';
import { issuesApi, issueKeys } from '@/features/issues/public';
import { notificationsApi, notificationKeys } from '@/features/notifications/public';
import { projectsApi, projectKeys } from '@/features/projects/public';
import { useAuth } from '@/providers/auth-provider';
import { LoadingScreen } from '@/shared/components/ui/screen';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';

export default function TabsLayout() {
  const { ready, user, orgId } = useAuth();
  const { theme: ui } = useAppPreferences();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ready || !user || !orgId) return;

    // Warm the primary tab data in the background. React Query deduplicates these
    // requests with any screen query that is already in flight, so first entry into
    // Projects/Inbox/My Work can render from cache instead of showing an empty shell.
    void Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: projectKeys.list(orgId),
        queryFn: projectsApi.list,
      }),
      queryClient.prefetchQuery({
        queryKey: issueKeys.myWork(orgId, user.id),
        queryFn: () => issuesApi.list({ assigneeId: user.id, limit: 100 }),
      }),
      queryClient.prefetchQuery({
        queryKey: notificationKeys.list(),
        queryFn: () => notificationsApi.list(false),
      }),
      queryClient.prefetchQuery({
        queryKey: notificationKeys.unread(),
        queryFn: notificationsApi.unreadCount,
      }),
    ]);
  }, [orgId, queryClient, ready, user]);

  if (!ready) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: ui.colors.bg },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="my-work" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
