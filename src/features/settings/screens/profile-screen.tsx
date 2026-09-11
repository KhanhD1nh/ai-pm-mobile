import { showAppSnackbar } from "@/shared/feedback/app-snackbar";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { Screen } from "@/shared/components/ui/screen";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import type { User } from "@/shared/contracts";
import { router } from "expo-router";
import { useTelegramSettings } from "@/features/telegram/public";
import {
  useChangePassword,
  useUpdateProfile,
} from "../mutations/use-profile-mutations";
import { confirmLogout } from "../components/confirm-logout";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const save = useUpdateProfile();
  const password = useChangePassword();
  const telegram = useTelegramSettings(Boolean(user));
  const onError = (error: unknown) =>
    presentError(
      language === "vi"
        ? "Không thể cập nhật hồ sơ"
        : "Could not update profile",
      error,
    );

  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Hồ sơ" : "Profile"}
      subtitle={user?.email}
    >
      {user ? (
        <>
          <View style={{ alignItems: "center", gap: 10, paddingVertical: 6 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: ui.colors.accentSoft,
              }}
            >
              <Text
                style={{
                  color: ui.colors.accent,
                  fontSize: 24,
                  fontWeight: "700",
                }}
              >
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{ color: ui.colors.text, fontSize: 22, fontWeight: "700" }}
            >
              {user.name}
            </Text>
            <Text style={{ color: ui.colors.textMuted, ...ui.typography.body }}>
              {user.email}
            </Text>
          </View>
          <ProfileForm
            key={`${user.id}-${user.name}`}
            user={user}
            saving={save.isPending}
            onSave={(name) =>
              save.mutate(name, {
                onSuccess: () =>
                  showAppSnackbar(
                    language === "vi" ? "Đã lưu hồ sơ" : "Profile saved",
                    { tone: "success" },
                  ),
                onError,
              })
            }
            language={language}
          />
        </>
      ) : null}

      <SectionHeader
        title={language === "vi" ? "Tài khoản liên kết" : "Connected accounts"}
      />
      <ListGroup>
        <ListRow
          first
          icon="paper-plane-outline"
          label="Telegram"
          detail={
            telegram.data?.linked && telegram.data.telegramUsername
              ? `@${telegram.data.telegramUsername}`
              : language === "vi"
                ? "Thông báo và đăng nhập nhanh"
                : "Notifications and quick sign-in"
          }
          value={
            telegram.isLoading
              ? "…"
              : telegram.data?.linked
                ? language === "vi"
                  ? "Đã kết nối"
                  : "Connected"
                : language === "vi"
                  ? "Chưa kết nối"
                  : "Not connected"
          }
          onPress={() => router.push("/settings/telegram" as never)}
        />
      </ListGroup>

      <SectionHeader
        title={language === "vi" ? "Bảo mật tài khoản" : "Account security"}
      />
      <PasswordForm
        changing={password.isPending}
        onSubmit={(currentPassword, newPassword, reset) =>
          password.mutate(
            { currentPassword, newPassword },
            {
              onSuccess: () => {
                reset();
                showAppSnackbar(
                  language === "vi" ? "Đã đổi mật khẩu" : "Password changed",
                  { tone: "success" },
                );
              },
              onError,
            },
          )
        }
        language={language}
      />

      <SectionHeader
        title={language === "vi" ? "Phiên đăng nhập" : "Session"}
      />
      <ListGroup>
        <ListRow
          first
          icon="log-out-outline"
          label={
            language === "vi"
              ? "Đăng xuất khỏi thiết bị này"
              : "Sign out from this device"
          }
          danger
          onPress={() => confirmLogout(language, logout)}
        />
      </ListGroup>
    </Screen>
  );
}

function ProfileForm({
  user,
  saving,
  onSave,
  language,
}: {
  user: User;
  saving: boolean;
  onSave: (name: string) => void;
  language: "vi" | "en";
}) {
  const [name, setName] = useState(user.name ?? "");
  return (
    <>
      <SectionHeader
        title={language === "vi" ? "Thông tin cá nhân" : "Personal information"}
      />
      <View style={{ gap: 10 }}>
        <Field
          placeholder={language === "vi" ? "Tên hiển thị" : "Display name"}
          value={name}
          onChangeText={setName}
        />
        <Field editable={false} value={user.email} />
        <Button
          title={
            saving
              ? language === "vi"
                ? "Đang lưu…"
                : "Saving…"
              : language === "vi"
                ? "Lưu thay đổi"
                : "Save changes"
          }
          disabled={!name.trim() || saving || name.trim() === (user.name ?? "")}
          onPress={() => onSave(name.trim())}
        />
      </View>
      <ListGroup>
        <ListRow
          first
          icon="shield-checkmark-outline"
          label={language === "vi" ? "Vai trò hệ thống" : "System role"}
          value={
            user.isSystemOwner || user.is_system_owner ? "System Owner" : "User"
          }
        />
      </ListGroup>
    </>
  );
}

function PasswordForm({
  changing,
  onSubmit,
  language,
}: {
  changing: boolean;
  onSubmit: (
    currentPassword: string,
    newPassword: string,
    reset: () => void,
  ) => void;
  language: "vi" | "en";
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
  };
  return (
    <View style={{ gap: 10 }}>
      <Field
        secureTextEntry
        placeholder={
          language === "vi" ? "Mật khẩu hiện tại" : "Current password"
        }
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <Field
        secureTextEntry
        placeholder={
          language === "vi"
            ? "Mật khẩu mới (tối thiểu 8 ký tự)"
            : "New password (8+ characters)"
        }
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Button
        title={
          changing
            ? language === "vi"
              ? "Đang đổi…"
              : "Changing…"
            : language === "vi"
              ? "Đổi mật khẩu"
              : "Change password"
        }
        disabled={!currentPassword || newPassword.length < 8 || changing}
        onPress={() => onSubmit(currentPassword, newPassword, reset)}
      />
    </View>
  );
}
