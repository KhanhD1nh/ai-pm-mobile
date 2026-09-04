import type { PropsWithChildren } from 'react';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
