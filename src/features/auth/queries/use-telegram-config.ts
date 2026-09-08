import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { authKeys } from "../query-keys";

export function useTelegramConfig() {
  return useQuery({
    queryKey: authKeys.telegramConfig(),
    queryFn: authApi.telegramConfig,
    staleTime: 60_000,
  });
}
