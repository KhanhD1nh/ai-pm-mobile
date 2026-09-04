import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Button, Card, Field, Muted } from '@/components/ui/primitives';
import { LoadingScreen, Screen } from '@/components/ui/screen';
import { projectsApi, wikiApi } from '@/services/api';
import type { WikiPage } from '@/types';

export default function WikiScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const pages = useQuery({ queryKey: ['wiki', project.data?.key], queryFn: () => wikiApi.list(project.data!.key), enabled: !!project.data?.key });
  const [selected, setSelected] = useState<WikiPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const save = useMutation({ mutationFn: () => wikiApi.save(project.data!.key, slug.trim(), title.trim(), content), onSuccess: async (page) => { await qc.invalidateQueries({ queryKey: ['wiki', project.data?.key] }); setSelected(page); setEditing(false); }, onError: (e) => Alert.alert('Không thể lưu Wiki', e instanceof Error ? e.message : 'Có lỗi xảy ra') });
  if (project.isLoading) return <LoadingScreen />;
  const startNew = () => { setSlug(''); setTitle(''); setContent(''); setSelected(null); setEditing(true); };
  const startEdit = (page: WikiPage) => { setSlug(page.slug); setTitle(page.title); setContent(page.content); setSelected(page); setEditing(true); };
  return <Screen title={`Wiki · ${project.data?.key ?? ''}`} right={<Button title="+ Page" onPress={startNew} />}>
    {selected && !editing ? <><Button kind="secondary" title="← Danh sách" onPress={() => setSelected(null)} /><Card><View style={styles.row}><Text style={styles.pageTitle}>{selected.title}</Text><Button kind="secondary" title="Sửa" onPress={() => startEdit(selected)} /></View><Markdown style={{ body: { color: '#d9e0e7' }, heading1: { color: '#fff' }, heading2: { color: '#fff' }, heading3: { color: '#fff' }, code_inline: { color: '#dbe6ef', backgroundColor: '#1b2632' } }}>{selected.content}</Markdown></Card></> : editing ? <Card><Field placeholder="slug" editable={!selected} value={slug} onChangeText={setSlug} /><Field placeholder="Tiêu đề" value={title} onChangeText={setTitle} /><Field multiline placeholder="Markdown" value={content} onChangeText={setContent} /><Button title={save.isPending ? 'Đang lưu...' : 'Lưu'} disabled={!slug.trim() || !title.trim() || save.isPending} onPress={() => save.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setEditing(false)} /></Card> : (pages.data ?? []).map((page) => <Pressable key={page.id} onPress={() => setSelected(page)}><Card><Text style={styles.pageTitle}>{page.title}</Text><Muted>{page.slug} · v{page.version}</Muted></Card></Pressable>)}
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, pageTitle: { flex: 1, color: '#f5f7fa', fontSize: 18, fontWeight: '900' } });
