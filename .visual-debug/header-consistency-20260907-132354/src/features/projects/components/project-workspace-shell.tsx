import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentTabs, GlassIconButton } from '@/shared/components/ui/mobile';
import { LoadingScreen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { useProjectDashboard } from '../hooks/use-project-dashboard';

type ProjectTab = 'overview' | 'tasks' | 'schedule';

function resolveTab(pathname: string, projectId: string): ProjectTab | null {
  const path = pathname.replace(/\/+$/, '');
  const base = `/project/${projectId}`;
  if (path === base) return 'overview';
  if (path === `${base}/board`) return 'tasks';
  if (path === `${base}/planning`) return 'schedule';
  return null;
}

export function ProjectWorkspaceShell({ children }: PropsWithChildren) {
  const { projectId = '' } = useLocalSearchParams<{ projectId: string }>();
  const pathname = usePathname();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project } = useProjectDashboard(projectId);
  const activeTab = resolveTab(pathname, projectId);

  if (!activeTab) return <>{children}</>;
  if (project.isLoading && !project.data) return <LoadingScreen />;

  const data = project.data;
  const selectTab = (next: string) => {
    if (next === activeTab || !projectId) return;
    if (next === 'overview') {
      router.replace({ pathname: '/project/[projectId]', params: { projectId } });
      return;
    }
    if (next === 'tasks') {
      router.replace(`/project/${projectId}/board` as never);
      return;
    }
    if (next === 'schedule') router.replace(`/project/${projectId}/planning` as never);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.chrome}>
        <View style={styles.appBar}>
          <GlassIconButton icon="chevron-back" label={language === 'vi' ? 'Quay lại' : 'Back'} onPress={() => router.back()} />

          <View style={styles.projectIdentity}>
            <View style={styles.projectCopy}>
              <Text style={styles.projectName} numberOfLines={1}>{data?.name ?? 'Project'}</Text>
              <Text style={styles.projectMeta}>{data?.key ?? ''}</Text>
            </View>
          </View>

          <GlassIconButton icon="search-outline" label={language === 'vi' ? 'Tìm kiếm' : 'Search'} onPress={() => router.push('/search')} />
        </View>

        <ContentTabs
          value={activeTab}
          onChange={selectTab}
          items={[
            { key: 'overview', label: language === 'vi' ? 'Tổng quan' : 'Overview' },
            { key: 'tasks', label: language === 'vi' ? 'Công việc' : 'Tasks' },
            { key: 'schedule', label: language === 'vi' ? 'Lịch' : 'Schedule' },
          ]}
        />
      </SafeAreaView>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.colors.bg },
  chrome: {
    zIndex: 2,
    backgroundColor: ui.colors.bg,
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 6,
  },
  appBar: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  projectIdentity: { flex: 1, minWidth: 0, justifyContent: 'center' },
  projectCopy: { flex: 1, minWidth: 0 },
  projectName: { color: ui.colors.text, ...ui.typography.bodyStrong, fontSize: 16 },
  projectMeta: { color: ui.colors.textMuted, ...ui.typography.caption, fontSize: 11, marginTop: 1 },
  content: { flex: 1, minHeight: 0 },
});


