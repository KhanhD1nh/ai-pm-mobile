import { useCallback, useRef, useState } from "react";

type RefreshAction = () => Promise<unknown> | unknown;

/**
 * Keeps the native pull-to-refresh indicator tied to the user's pull gesture,
 * not to background TanStack Query refetches triggered by mutations, focus, or reconnects.
 */
export function usePullToRefresh(refresh: RefreshAction) {
  const [refreshing, setRefreshing] = useState(false);
  const running = useRef(false);

  const onRefresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      running.current = false;
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}
