import { useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram-api';
import { telegramKeys } from '../query-keys';

export function useCreateTelegramLink() {
  return useMutation({ mutationFn: telegramApi.createLinkToken });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => telegramApi.updatePreferences({ unlink: true }),
    onSuccess: (data) => queryClient.setQueryData(telegramKeys.preferences(), data),
  });
}
