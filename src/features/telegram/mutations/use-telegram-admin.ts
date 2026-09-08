import { useMutation, useQueryClient } from "@tanstack/react-query";
import { telegramApi } from "../api/telegram-api";
import { telegramKeys } from "../query-keys";

export function useUpdateTelegramAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: telegramApi.updateAdminSettings,
    onSuccess: (data) => {
      qc.setQueryData(telegramKeys.admin(), data);
      void qc.invalidateQueries({ queryKey: telegramKeys.webhook() });
    },
  });
}

export function useTestTelegramBot() {
  return useMutation({
    mutationFn: (token?: string) => telegramApi.testBot(token),
  });
}

export function useRegisterTelegramWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url?: string) => telegramApi.registerWebhook(url),
    onSuccess: () => qc.invalidateQueries({ queryKey: telegramKeys.webhook() }),
  });
}
