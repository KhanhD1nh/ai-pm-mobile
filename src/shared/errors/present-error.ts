import { Alert } from "react-native";
import { normalizeError } from "./app-error";

export function presentError(title: string, error: unknown) {
  const normalized = normalizeError(error);
  const message =
    normalized.code === "VERSION_CONFLICT"
      ? `${normalized.message}\nDữ liệu đã thay đổi ở nơi khác. Hãy tải lại rồi thử lại.`
      : normalized.message;
  Alert.alert(title, message);
}
