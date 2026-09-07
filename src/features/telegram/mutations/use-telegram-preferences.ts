import { useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from '../api/telegram-api';
import { telegramKeys } from '../query-keys';
import type { TelegramPreferences, TelegramPreferenceKey } from '../contracts';

export function useUpdateTelegramPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: TelegramPreferenceKey; value: boolean }) =>
      telegramApi.updatePreferences({ [key]: value }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: telegramKeys.preferences() });
      const previous = queryClient.getQueryData<TelegramPreferences>(telegramKeys.preferences());
      if (previous) queryClient.setQueryData<TelegramPreferences>(telegramKeys.preferences(), { ...previous, [key]: value });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(telegramKeys.preferences(), context.previous);
    },
    onSuccess: (data) => queryClient.setQueryData(telegramKeys.preferences(), data),
  });
}
