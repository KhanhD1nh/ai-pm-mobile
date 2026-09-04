import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthProvider } from './auth-context';

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'AI_PM_QUERY_CACHE' });

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: 24 * 60 * 60 * 1000, retry: (count, error: any) => ![401, 403, 404].includes(error?.status) && count < 2 },
      mutations: { retry: 0 },
    },
  }));

  useEffect(() => NetInfo.addEventListener((state) => onlineManager.setOnline(Boolean(state.isConnected))), []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}>
      <AuthProvider>{children}</AuthProvider>
    </PersistQueryClientProvider>
  );
}
