import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingScreen />;
  return <Redirect href={user ? '/(tabs)/home' : '/login'} />;
}
