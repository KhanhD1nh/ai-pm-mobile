import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) return <LoadingScreen />;
  return <Redirect href={user ? '/(tabs)/home' : '/login'} />;
}
