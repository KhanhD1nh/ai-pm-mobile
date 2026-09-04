import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Muted } from '@/shared/components/ui/primitives';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import type { Project } from '@/shared/contracts';
import { useProject } from '../queries/use-projects';
import { useUpdateProject } from '../mutations/use-project-mutations';

type ProjectSettingsInput = {
  name: string;
  description: string;
  telegramChannelId: string | null;
  webhookUrl: string | null;
};

export default function ProjectSettingsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useProject(projectId);
  const save = useUpdateProject(projectId);

  if (project.isLoading) return <LoadingScreen />;
  if (!project.data) return <Screen title="Project settings"><Muted>Không tìm thấy dự án.</Muted></Screen>;

  const submit = (input: ProjectSettingsInput) => save.mutate(input, {
    onSuccess: () => Alert.alert('Đã lưu'),
    onError: (error) => presentError('Không thể lưu', error),
  });

  return (
    <Screen title={`Settings · ${project.data.key}`}>
      <ProjectSettingsForm
        key={`${project.data.id}-${project.dataUpdatedAt}`}
        project={project.data}
        saving={save.isPending}
        onSubmit={submit}
      />
      <Card>
        <Text style={styles.title}>Mobile-first settings</Text>
        <Muted>Các cấu hình workflow, members và notifications được tách thành màn riêng để thao tác thuận tiện trên điện thoại.</Muted>
      </Card>
    </Screen>
  );
}

function ProjectSettingsForm({ project, saving, onSubmit }: { project: Project; saving: boolean; onSubmit: (input: ProjectSettingsInput) => void }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [telegramChannelId, setTelegramChannelId] = useState(project.telegram_channel_id ?? '');
  const [webhookUrl, setWebhookUrl] = useState(project.webhook_url ?? '');

  return (
    <Card>
      <Label>Tên dự án</Label>
      <Field value={name} onChangeText={setName} />
      <Label>Mô tả</Label>
      <Field multiline value={description} onChangeText={setDescription} />
      <Label>Telegram Channel ID</Label>
      <Field value={telegramChannelId} onChangeText={setTelegramChannelId} />
      <Label>Webhook URL</Label>
      <Field autoCapitalize="none" value={webhookUrl} onChangeText={setWebhookUrl} />
      <Button
        title={saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        disabled={!name.trim() || saving}
        onPress={() => onSubmit({
          name: name.trim(),
          description: description.trim(),
          telegramChannelId: telegramChannelId.trim() || null,
          webhookUrl: webhookUrl.trim() || null,
        })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({ title: { color: '#eef2f6', fontWeight: '800' } });
