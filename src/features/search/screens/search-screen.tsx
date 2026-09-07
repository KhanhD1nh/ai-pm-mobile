import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ListGroup, SearchBar, SectionHeader } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import { Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { useAuth } from '@/providers/auth-provider';
import { useGlobalSearch } from '../hooks/use-global-search';

export default function SearchScreen() {
  const { orgId } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [query, setQuery] = useState('');
  const result = useGlobalSearch(orgId, query);
  const hasQuery = query.trim().length >= 2;
  const total = result.projects.length + result.issues.length;

  return (
    <Screen chrome="stack" title={language === 'vi' ? 'Tìm kiếm' : 'Search'} subtitle={hasQuery ? `${total} ${language === 'vi' ? 'kết quả' : 'results'}` : (language === 'vi' ? 'Issue và dự án' : 'Issues and projects')}>
      <SearchBar autoFocus placeholder={language === 'vi' ? 'Tìm issue, project…' : 'Search issues, projects…'} value={query} onChangeText={setQuery} />

      {!hasQuery ? <View style={styles.hint}><Ionicons accessible={false} name="sparkles-outline" size={20} color={ui.colors.accent} /><Text style={styles.hintText}>{language === 'vi' ? 'Nhập ít nhất 2 ký tự để bắt đầu tìm.' : 'Type at least 2 characters to start searching.'}</Text></View> : null}

      {result.projects.length > 0 ? <>
        <SectionHeader title={language === 'vi' ? 'Dự án' : 'Projects'} caption={`${result.projects.length}`} />
        <ListGroup variant="plain">
          {result.projects.map((project, index) => <MotionPressable accessibilityRole="button" accessibilityLabel={project.name} key={project.id} onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } })} style={[styles.resultRow, index > 0 && styles.border]}><View style={styles.projectIcon}><Text style={styles.projectIconText}>{project.name.charAt(0).toUpperCase()}</Text></View><View style={styles.copy}><Text style={styles.title}>{project.name}</Text><Text style={styles.meta}>{project.key}</Text></View><Ionicons accessible={false} name="chevron-forward" size={17} color={ui.colors.textMuted} /></MotionPressable>)}
        </ListGroup>
      </> : null}

      {result.issues.length > 0 ? <>
        <SectionHeader title="Issues" caption={`${result.issues.length}`} />
        <ListGroup variant="plain">
          {result.issues.map((issue, index) => <MotionPressable accessibilityRole="button" accessibilityLabel={`${issue.identifier}, ${issue.title}`} key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })} style={[styles.resultRow, index > 0 && styles.border]}><View style={styles.issueIcon}><Ionicons accessible={false} name="checkmark-circle-outline" size={17} color={ui.colors.accent} /></View><View style={styles.copy}><Text style={styles.title} numberOfLines={2}>{issue.title}</Text><Text style={styles.meta}>{issue.identifier} · {issue.status?.name ?? '—'} · {issue.priority}</Text></View><Ionicons accessible={false} name="chevron-forward" size={17} color={ui.colors.textMuted} /></MotionPressable>)}
        </ListGroup>
      </> : null}

      {hasQuery && total === 0 ? <View style={styles.empty}><Ionicons accessible={false} name="search-outline" size={24} color={ui.colors.textMuted} /><Text style={styles.emptyTitle}>{language === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'}</Text><Text style={styles.emptyBody}>{language === 'vi' ? 'Thử từ khóa ngắn hơn hoặc mã issue.' : 'Try a shorter term or issue identifier.'}</Text></View> : null}
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  searchWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, borderRadius: ui.radius.lg, backgroundColor: ui.colors.surface, borderWidth: 1, borderColor: ui.colors.border, ...ui.shadow.card },
  searchField: { flex: 1, minHeight: 50, borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 0 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: ui.radius.md, backgroundColor: ui.colors.accentSoft },
  hintText: { flex: 1, color: ui.colors.textSecondary, ...ui.typography.body },
  resultRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.colors.border },
  projectIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.accentSoft },
  projectIconText: { color: ui.colors.accent, fontWeight: '700' },
  issueIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  copy: { flex: 1, minWidth: 0 },
  title: { color: ui.colors.text, ...ui.typography.bodyStrong },
  meta: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 3 },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 44 },
  emptyTitle: { color: ui.colors.text, ...ui.typography.heading },
  emptyBody: { color: ui.colors.textMuted, ...ui.typography.body, textAlign: 'center' },
});

