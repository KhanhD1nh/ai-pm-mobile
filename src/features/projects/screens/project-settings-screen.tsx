import { showAppSnackbar } from "@/shared/feedback/app-snackbar";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { LoadingScreen, Screen } from "@/shared/components/ui/screen";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import type { Project } from "@/shared/contracts";
import { useProject } from "../queries/use-projects";
import { useUpdateProject } from "../mutations/use-project-mutations";

type ProjectSettingsInput = {
  name: string;
  description: string;
  telegramChannelId: string | null;
  webhookUrl: string | null;
};

export default function ProjectSettingsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const project = useProject(projectId);
  const save = useUpdateProject(projectId);
  if (project.isLoading)
    return (
      <LoadingScreen
        chrome="stack"
        title={language === "vi" ? "Cài đặt dự án" : "Project settings"}
      />
    );
  if (!project.data)
    return (
      <Screen
        chrome="stack"
        title={language === "vi" ? "Cài đặt dự án" : "Project settings"}
      >
        <Text style={{ color: ui.colors.textSecondary }}>
          {language === "vi" ? "Không tìm thấy dự án." : "Project not found."}
        </Text>
      </Screen>
    );
  const submit = (input: ProjectSettingsInput) =>
    save.mutate(input, {
      onSuccess: () =>
        showAppSnackbar(language === "vi" ? "Đã lưu" : "Saved", {
          tone: "success",
        }),
      onError: (error) =>
        presentError(
          language === "vi" ? "Không thể lưu" : "Could not save",
          error,
        ),
    });
  return (
    <Screen
      chrome="stack"
      title={language === "vi" ? "Cài đặt dự án" : "Project settings"}
      subtitle={project.data.name}
    >
      <ProjectSettingsForm
        key={`${project.data.id}-${project.dataUpdatedAt}`}
        project={project.data}
        saving={save.isPending}
        onSubmit={submit}
        language={language}
      />
      <SectionHeader title={language === "vi" ? "Tích hợp" : "Integrations"} />
      <ListGroup>
        <ListRow
          first
          icon="paper-plane-outline"
          label="Telegram"
          detail={
            language === "vi"
              ? "Gửi cập nhật dự án vào channel"
              : "Send project updates to a channel"
          }
          value={project.data.telegram_channel_id ? "ON" : "OFF"}
        />
        <ListRow
          icon="link-outline"
          label="Webhook"
          detail={
            language === "vi"
              ? "Đẩy sự kiện sang hệ thống khác"
              : "Forward events to another system"
          }
          value={project.data.webhook_url ? "ON" : "OFF"}
        />
      </ListGroup>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 14,
          borderRadius: ui.radius.md,
          backgroundColor: ui.colors.accentSoft,
        }}
      >
        <Ionicons
          accessible={false}
          name="phone-portrait-outline"
          size={18}
          color={ui.colors.accent}
        />
        <Text
          style={{
            flex: 1,
            color: ui.colors.textSecondary,
            ...ui.typography.body,
          }}
        >
          {language === "vi"
            ? "Các thao tác phức tạp như workflow và members được tách riêng để dùng trên mobile dễ hơn."
            : "Complex settings such as workflow and members live in focused screens for better mobile use."}
        </Text>
      </View>
    </Screen>
  );
}

function ProjectSettingsForm({
  project,
  saving,
  onSubmit,
  language,
}: {
  project: Project;
  saving: boolean;
  onSubmit: (input: ProjectSettingsInput) => void;
  language: "vi" | "en";
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [telegramChannelId, setTelegramChannelId] = useState(
    project.telegram_channel_id ?? "",
  );
  const [webhookUrl, setWebhookUrl] = useState(project.webhook_url ?? "");
  return (
    <>
      <SectionHeader
        title={language === "vi" ? "Thông tin chung" : "General"}
      />
      <View style={{ gap: 10 }}>
        <Field
          placeholder={language === "vi" ? "Tên dự án" : "Project name"}
          value={name}
          onChangeText={setName}
        />
        <Field
          placeholder={language === "vi" ? "Mô tả" : "Description"}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Field
          placeholder="Telegram Channel ID"
          value={telegramChannelId}
          onChangeText={setTelegramChannelId}
        />
        <Field
          placeholder="Webhook URL"
          autoCapitalize="none"
          value={webhookUrl}
          onChangeText={setWebhookUrl}
        />
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
          disabled={!name.trim() || saving}
          onPress={() =>
            onSubmit({
              name: name.trim(),
              description: description.trim(),
              telegramChannelId: telegramChannelId.trim() || null,
              webhookUrl: webhookUrl.trim() || null,
            })
          }
        />
      </View>
    </>
  );
}
