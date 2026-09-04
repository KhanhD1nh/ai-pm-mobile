import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Muted } from '@/components/ui/primitives';
import { LoadingScreen, Screen } from '@/components/ui/screen';
import { projectsApi } from '@/services/api';

export default function ProjectSettingsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [telegramChannelId, setTelegramChannelId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  useEffect(() => { if (project.data) { setName(project.data.name); setDescription(project.data.description ?? ''); setTelegramChannelId(project.data.telegram_channel_id ?? ''); setWebhookUrl(project.data.webhook_url ?? ''); } }, [project.data]);
  const save = useMutation({ mutationFn: () => projectsApi.update(projectId!, { name: name.trim(), description: description.trim(), telegramChannelId: telegramChannelId.trim() || null, webhookUrl: webhookUrl.trim() || null }), onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['project', projectId] }), qc.invalidateQueries({ queryKey: ['projects'] })]); Alert.alert('Đã lưu'); }, onError: (e) => Alert.alert('Không thể lưu', e instanceof Error ? e.message : 'Có lỗi xảy ra') });
  if (project.isLoading) return <LoadingScreen />;
  return <Screen title={`Settings · ${project.data?.key ?? ''}`}>
    <Card><Label>Tên dự án</Label><Field value={name} onChangeText={setName} /><Label>Mô tả</Label><Field multiline value={description} onChangeText={setDescription} /><Label>Telegram Channel ID</Label><Field value={telegramChannelId} onChangeText={setTelegramChannelId} /><Label>Webhook URL</Label><Field autoCapitalize="none" value={webhookUrl} onChangeText={setWebhookUrl} /><Button title={save.isPending ? 'Đang lưu...' : 'Lưu thay đổi'} disabled={!name.trim() || save.isPending} onPress={() => save.mutate()} /></Card>
    <Card><Text style={styles.title}>Mobile-first settings</Text><Muted>Các cấu hình workflow, members và notifications được tách thành màn riêng để thao tác thuận tiện trên điện thoại.</Muted></Card>
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: '#eef2f6', fontWeight: '800' } });
