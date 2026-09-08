import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";

export const QUERY_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
export const QUERY_CACHE_BUSTER = "ai-pm-mobile-cache-v2";

/**
 * Persist only bounded, useful offline reads. Search/admin/activity/detail side-data
 * can be large or sensitive and is cheap to refetch when connectivity returns.
 */
export function shouldPersistQuery(query: Query) {
  if (query.state.status !== "success") return false;
  const [domain, kind] = query.queryKey;
  if (domain === "projects") return kind === "list" || kind === "detail";
  if (domain === "issues") return kind === "my-work" || kind === "project";
  return false;
}

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "AI_PM_QUERY_CACHE",
});
