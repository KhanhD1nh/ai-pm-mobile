import { showAppAlert } from "@/shared/feedback/app-alert";
import { showAppSnackbar } from "@/shared/feedback/app-snackbar";
import { Switch, Text, View } from "react-native";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import {
  ErrorState,
  LoadingScreen,
  Screen,
} from "@/shared/components/ui/screen";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAuth } from "@/providers/auth-provider";
import {
  useRegisterTelegramWebhook,
  useTelegramAdmin,
  useTestTelegramBot,
  useUpdateTelegramAdmin,
} from "../public";
import { useState } from "react";

export default function TelegramAdminScreen() {
  const { user } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const owner = Boolean(user?.isSystemOwner || user?.is_system_owner);
  const { settings, webhook } = useTelegramAdmin(owner);
  const update = useUpdateTelegramAdmin();
  const test = useTestTelegramBot();
  const register = useRegisterTelegramWebhook();
  const pullRefresh = usePullToRefresh(() =>
    Promise.all([settings.refetch(), webhook.refetch()]),
  );
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const vi = language === "vi";

  if (!owner)
    return (
      <Screen chrome="stack" title="Telegram Bot">
        <Text style={{ color: ui.colors.textMuted, ...ui.typography.body }}>
          {vi
            ? "Chỉ System Owner có thể quản trị Telegram bot."
            : "Only the System Owner can manage the Telegram bot."}
        </Text>
      </Screen>
    );
  if (settings.isLoading && !settings.data)
    return <LoadingScreen title="Telegram Bot" chrome="stack" />;
  if (settings.isError && !settings.data) {
    return (
      <Screen chrome="stack" title="Telegram Bot">
        <ErrorState
          title={
            vi
              ? "Không tải được cấu hình Telegram"
              : "Could not load Telegram configuration"
          }
          body={
            vi
              ? "Kiểm tra quyền System Owner và kết nối backend."
              : "Check System Owner access and backend connectivity."
          }
          onRetry={() => void settings.refetch()}
        />
      </Screen>
    );
  }

  const save = () =>
    update.mutate(
      {
        token: token.trim() || undefined,
        username: username.trim() || undefined,
      },
      {
        onSuccess: () => {
          setToken("");
          showAppSnackbar(vi ? "Đã lưu" : "Saved", { tone: "success" });
        },
        onError: (error) =>
          presentError(
            vi ? "Không thể lưu Telegram bot" : "Could not save Telegram bot",
            error,
          ),
      },
    );
  const toggleEnabled = (enabled: boolean) =>
    update.mutate(
      { enabled },
      {
        onError: (error) =>
          presentError(
            vi
              ? "Không thể cập nhật Telegram bot"
              : "Could not update Telegram bot",
            error,
          ),
      },
    );
  const testBot = () =>
    test.mutate(token.trim() || undefined, {
      onSuccess: (result) => {
        if (result.ok) {
          showAppSnackbar(
            result.bot?.username
              ? `${vi ? "Kết nối thành công" : "Connection successful"} · @${result.bot.username}`
              : vi
                ? "Kết nối thành công"
                : "Connection successful",
            { tone: "success" },
          );
          return;
        }
        showAppAlert(
          vi ? "Kết nối thất bại" : "Connection failed",
          result.error,
          undefined,
          { tone: "danger" },
        );
      },
      onError: (error) =>
        presentError(vi ? "Không thể test bot" : "Could not test bot", error),
    });
  const saveWebhook = () =>
    register.mutate(webhookUrl.trim() || undefined, {
      onSuccess: (result) => {
        if (result.ok) {
          showAppSnackbar(vi ? "Webhook đã đăng ký" : "Webhook registered", {
            tone: "success",
          });
          return;
        }
        showAppAlert(
          vi ? "Webhook thất bại" : "Webhook failed",
          result.description || result.error,
          undefined,
          { tone: "danger" },
        );
      },
      onError: (error) =>
        presentError(
          vi ? "Không thể đăng ký webhook" : "Could not register webhook",
          error,
        ),
    });
  const webhookUnavailable = webhook.data?.ok === false;
  const webhookUnavailableDetail =
    webhook.data?.error === "No Telegram bot token configured"
      ? vi
        ? "Hãy lưu Bot token trước khi đăng ký webhook."
        : "Save a bot token before registering the webhook."
      : webhook.data?.error;

  return (
    <Screen
      chrome="stack"
      title="Telegram Bot"
      subtitle={vi ? "Quản trị hệ thống" : "System administration"}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <SectionHeader title={vi ? "Trạng thái" : "Status"} />
      <ListGroup>
        <ListRow
          first
          icon="paper-plane-outline"
          label={vi ? "Bật Telegram bot" : "Enable Telegram bot"}
          detail={
            settings.data?.username ? `@${settings.data.username}` : undefined
          }
          trailing={
            <Switch
              value={Boolean(settings.data?.enabled)}
              disabled={update.isPending}
              onValueChange={toggleEnabled}
              trackColor={{ true: ui.colors.accent }}
            />
          }
        />
        <ListRow
          icon="key-outline"
          label={vi ? "Bot token" : "Bot token"}
          value={
            settings.data?.hasToken
              ? (settings.data.tokenMasked ?? "Configured")
              : vi
                ? "Chưa có"
                : "Missing"
          }
        />
      </ListGroup>

      <SectionHeader title={vi ? "Cấu hình bot" : "Bot configuration"} />
      <View style={{ gap: 10 }}>
        <Field
          autoCapitalize="none"
          placeholder={
            settings.data?.username || (vi ? "Bot username" : "Bot username")
          }
          value={username}
          onChangeText={setUsername}
        />
        <Field
          autoCapitalize="none"
          secureTextEntry
          placeholder={
            vi
              ? "Token mới (để trống nếu giữ nguyên)"
              : "New token (leave empty to keep current)"
          }
          value={token}
          onChangeText={setToken}
        />
        <Button
          title={
            update.isPending ? "…" : vi ? "Lưu cấu hình" : "Save configuration"
          }
          disabled={update.isPending || (!token.trim() && !username.trim())}
          onPress={save}
        />
        <Button
          kind="secondary"
          title={
            test.isPending
              ? "…"
              : vi
                ? "Kiểm tra kết nối bot"
                : "Test bot connection"
          }
          disabled={test.isPending}
          onPress={testBot}
        />
      </View>

      <SectionHeader
        title="Webhook"
        caption={
          webhook.data?.url ||
          (vi
            ? "Telegram gửi update tới URL này."
            : "Telegram sends updates to this URL.")
        }
      />
      <ListGroup>
        {!webhookUnavailable ? (
          <ListRow
            first
            icon="cloud-done-outline"
            label={vi ? "Cập nhật đang chờ" : "Pending updates"}
            value={String(webhook.data?.pendingUpdateCount ?? 0)}
          />
        ) : null}
        {webhook.data?.lastErrorMessage ? (
          <ListRow
            icon="warning-outline"
            label={vi ? "Lỗi gần nhất" : "Last error"}
            detail={webhook.data.lastErrorMessage}
            danger
          />
        ) : null}
        {webhookUnavailable ? (
          <ListRow
            first
            icon="information-circle-outline"
            label={vi ? "Webhook chưa sẵn sàng" : "Webhook not ready"}
            detail={webhookUnavailableDetail}
          />
        ) : null}
        {webhook.isError ? (
          <ListRow
            icon="warning-outline"
            label={
              vi
                ? "Không đọc được trạng thái webhook"
                : "Could not read webhook status"
            }
            detail={
              vi
                ? "Bot có thể chưa được cấu hình hoặc Telegram API đang lỗi."
                : "The bot may be unconfigured or the Telegram API may be unavailable."
            }
            danger
            onPress={() => void webhook.refetch()}
          />
        ) : null}
      </ListGroup>
      <View style={{ gap: 10 }}>
        <Field
          autoCapitalize="none"
          keyboardType="url"
          placeholder={
            webhook.data?.url ||
            (vi
              ? "Webhook URL (để trống dùng mặc định)"
              : "Webhook URL (empty uses default)")
          }
          value={webhookUrl}
          onChangeText={setWebhookUrl}
        />
        <Button
          title={
            register.isPending
              ? "…"
              : vi
                ? "Đăng ký webhook"
                : "Register webhook"
          }
          disabled={register.isPending || !settings.data?.hasToken}
          onPress={saveWebhook}
        />
      </View>
    </Screen>
  );
}
