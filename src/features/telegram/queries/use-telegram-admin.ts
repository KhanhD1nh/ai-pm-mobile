import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/errors/api-error";
import { telegramApi } from "../api/telegram-api";
import { telegramKeys } from "../query-keys";

function retryServerFailure(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500)
    return false;
  return failureCount < 2;
}

export function useTelegramAdmin(enabled = true) {
  const settings = useQuery({
    queryKey: telegramKeys.admin(),
    queryFn: telegramApi.getAdminSettings,
    enabled,
  });
  const webhook = useQuery({
    queryKey: telegramKeys.webhook(),
    queryFn: telegramApi.getWebhookInfo,
    enabled,
    retry: retryServerFailure,
  });
  return { settings, webhook };
}
