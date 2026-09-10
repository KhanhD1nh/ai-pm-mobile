import { Alert } from "react-native";
import type { AppLanguage } from "@/shared/preferences/app-preferences-context";

export function confirmLogout(
  language: AppLanguage,
  onConfirm: () => Promise<void>,
) {
  const vi = language === "vi";

  Alert.alert(
    vi ? "Đăng xuất?" : "Sign out?",
    vi
      ? "Bạn có chắc muốn đăng xuất khỏi AI-PM trên thiết bị này không?"
      : "Are you sure you want to sign out of AI-PM on this device?",
    [
      {
        text: vi ? "Hủy" : "Cancel",
        style: "cancel",
      },
      {
        text: vi ? "Đăng xuất" : "Sign out",
        style: "destructive",
        onPress: () => void onConfirm(),
      },
    ],
  );
}
