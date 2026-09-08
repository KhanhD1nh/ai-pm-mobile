import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState, type PropsWithChildren } from "react";
import { bindOnlineManager } from "@/infrastructure/networking/online-manager";
import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE_MS,
  queryPersister,
  shouldPersistQuery,
} from "@/infrastructure/persistence/query-persister";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: QUERY_CACHE_MAX_AGE_MS,
            retry: (count, error: unknown) => {
              const status =
                typeof error === "object" && error !== null && "status" in error
                  ? Number((error as { status?: unknown }).status)
                  : undefined;
              return ![401, 403, 404].includes(status ?? 0) && count < 2;
            },
          },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(() => bindOnlineManager(), []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: QUERY_CACHE_MAX_AGE_MS,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
