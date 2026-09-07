import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Button, Field } from '@/shared/components/ui/primitives';
import { BottomSheet, FloatingActionButton, ListGroup, SectionHeader } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import type { WikiPage } from '@/shared/contracts';
import { useProjectWiki } from '../queries/use-wiki';
import { useSaveWikiPage } from '../mutations/use-wiki-mutations';

export default function WikiScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project, pages } = useProjectWiki(projectId);
  const save = useSaveWikiPage(project.data?.key);
  const [selected, setSelected] = useState<WikiPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (project.isLoading) return <LoadingScreen chrome="stack" title="Wiki" />;

  const startNew = () => { setSlug(''); setTitle(''); setContent(''); setSelected(null); setEditing(true); };
  const startEdit = (page: WikiPage) => { setSlug(page.slug); setTitle(page.title); setContent(page.content); setSelected(page); setEditing(true); };
  const submit = () => save.mutate({ slug: slug.trim(), title: title.trim(), content }, { onSuccess: (page) => { setSelected(page); setEditing(false); }, onError: (error) => presentError(language === 'vi' ? 'Không thể lưu Wiki' : 'Could not save Wiki', error) });

  return (
    <Screen chrome="stack" title="Wiki" subtitle={project.data?.name ?? project.data?.key} floating={<FloatingActionButton label={language === 'vi' ? 'Trang mới' : 'New page'} onPress={startNew} />}>
      {selected ? (
        <>
          <View style={styles.readerTop}><MotionPressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.backButton}><Ionicons accessible={false} name="arrow-back" size={18} color={ui.colors.textSecondary} /><Text style={styles.backText}>{language === 'vi' ? 'Danh sách' : 'Pages'}</Text></MotionPressable><Button kind="secondary" title={language === 'vi' ? 'Sửa' : 'Edit'} onPress={() => startEdit(selected)} /></View>
          <View style={styles.article}>
            <Text style={styles.pageTitle}>{selected.title}</Text>
            <Text style={styles.pageMeta}>{selected.slug} · v{selected.version}</Text>
            <View style={styles.divider} />
            <Markdown style={{ body: { color: ui.colors.textSecondary, fontSize: 15, lineHeight: 24 }, heading1: { color: ui.colors.text }, heading2: { color: ui.colors.text }, heading3: { color: ui.colors.text }, code_inline: { color: ui.colors.text, backgroundColor: ui.colors.surfaceRaised } }}>{selected.content}</Markdown>
          </View>
        </>
      ) : (
        <>
          <SectionHeader title={language === 'vi' ? 'Trang tài liệu' : 'Documentation pages'} caption={`${pages.data?.length ?? 0}`} />
          <ListGroup variant="plain">
            {(pages.data ?? []).map((page, index) => <MotionPressable accessibilityRole="button" accessibilityLabel={`${page.title}, ${page.slug}`} key={page.id} onPress={() => setSelected(page)} style={[styles.pageRow, index > 0 && styles.border]}><View style={styles.pageIcon}><Ionicons accessible={false} name="document-text-outline" size={18} color={ui.colors.accent} /></View><View style={styles.copy}><Text style={styles.rowTitle}>{page.title}</Text><Text style={styles.rowMeta}>{page.slug} · v{page.version}</Text></View><Ionicons accessible={false} name="chevron-forward" size={17} color={ui.colors.textMuted} /></MotionPressable>)}
          </ListGroup>
        </>
      )}

      <BottomSheet visible={editing} title={selected ? (language === 'vi' ? 'Sửa trang' : 'Edit page') : (language === 'vi' ? 'Trang mới' : 'New page')} onClose={() => setEditing(false)} footer={<Button title={save.isPending ? (language === 'vi' ? 'Đang lưu…' : 'Saving…') : (language === 'vi' ? 'Lưu trang' : 'Save page')} disabled={!slug.trim() || !title.trim() || save.isPending} onPress={submit} />}>
        <Field placeholder="slug" editable={!selected} value={slug} onChangeText={setSlug} />
        <Field placeholder={language === 'vi' ? 'Tiêu đề' : 'Title'} value={title} onChangeText={setTitle} />
        <Field multiline placeholder="Markdown" value={content} onChangeText={setContent} style={{ minHeight: 240 }} />
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  readerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: ui.colors.surfaceRaised },
  backText: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '700' },
  article: { paddingHorizontal: 1, paddingVertical: 8 },
  pageTitle: { color: ui.colors.text, fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.65 },
  pageMeta: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.colors.border, marginVertical: 16 },
  pageRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.colors.border },
  pageIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.accentSoft },
  copy: { flex: 1, minWidth: 0 },
  rowTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
  rowMeta: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 3 },
});

