import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { flushOfflineMutationQueue } from "@/infrastructure/persistence/offline-mutation-queue";
import { useAuth } from "@/providers/auth-provider";

export function OfflineMutationBootstrap() {
  const queryClient = useQueryClient();
  const { ready, user, orgId } = useAuth();

  useEffect(() => {
    if (!ready || !user || !orgId) return;

    const flush = async () => {
      const result = await flushOfflineMutationQueue();
      if (result.flushed > 0) await queryClient.invalidateQueries();
    };

    void flush();
    return NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false)
        void flush();
    });
  }, [orgId, queryClient, ready, user]);

  return null;
}
