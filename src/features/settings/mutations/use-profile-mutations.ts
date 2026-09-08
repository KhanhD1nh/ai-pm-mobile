import { useMutation } from "@tanstack/react-query";
import { settingsApi } from "../api/settings-api";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (name: string) => settingsApi.updateMe({ name }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => settingsApi.changePassword(currentPassword, newPassword),
  });
}
