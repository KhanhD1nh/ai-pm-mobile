import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "../api/settings-api";
import { settingsKeys } from "../query-keys";

export function useSystemUsers(enabled: boolean) {
  return useQuery({
    queryKey: settingsKeys.systemUsers(),
    queryFn: settingsApi.systemUsers,
    enabled,
  });
}
