import { useQuery } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram-api';
import { telegramKeys } from '../query-keys';

export function useTelegramSettings(enabled = true) {
  return useQuery({
    queryKey: telegramKeys.preferences(),
    queryFn: telegramApi.getPreferences,
    enabled,
    staleTime: 15_000,
  });
}
