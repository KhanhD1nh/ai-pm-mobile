import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { authKeys } from "../query-keys";

export function useSetupStatus() {
  return useQuery({
    queryKey: authKeys.setupStatus(),
    queryFn: authApi.setupStatus,
    staleTime: 60_000,
  });
}
