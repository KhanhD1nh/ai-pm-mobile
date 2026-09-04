import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { LoadingScreen, Screen } from '@/components/ui/screen';
import { projectsApi } from '@/services/api';

const menu = [
  ['Board', 'kanban-outline', 'board'],
  ['Planning', 'calendar-outline', 'planning'],
  ['Wiki', 'document-text-outline', 'wiki'],
  ['Members', 'people-outline', 'members'],
  ['Workflow', 'git-branch-outline', 'workflow'],
  ['Settings', 'settings-outline', 'settings'],
] as const;

export default function ProjectHomeScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const report = useQuery({ queryKey: ['project-report', project.data?.key], queryFn: () => projectsApi.report(project.data!.key), enabled: !!project.data?.key });
  if (project.isLoading) return <LoadingScreen />;
  if (!project.data) return <Screen title="Project"><Muted>Không tìm thấy dự án.</Muted></Screen>;
  const p = project.data;
  const totals = report.data?.totals;
  return <Screen title={p.name} subtitle={p.key} refreshing={project.isRefetching || report.isRefetching} onRefresh={() => { void project.refetch(); void report.refetch(); }}>
    {p.description ? <Muted>{p.description}</Muted> : null}
    <View style={styles.stats}>
      <Card><Text style={styles.num}>{totals?.total_issues ?? p.issue_counter}</Text><Muted>Issues</Muted></Card>
      <Card><Text style={styles.num}>{totals?.in_progress ?? 0}</Text><Muted>Doing</Muted></Card>
      <Card><Text style={styles.num}>{totals?.done ?? 0}</Text><Muted>Done</Muted></Card>
    </View>
    {(report.data?.alerts?.length ?? 0) > 0 ? <><SectionTitle>Cần chú ý</SectionTitle>{report.data!.alerts!.map((alert, index) => <Card key={`${alert.type}-${index}`}><View style={styles.row}><Pill text={alert.severity} /><Text style={styles.itemTitle}>{alert.type.replaceAll('_', ' ')}</Text><Text style={styles.count}>{alert.count}</Text></View></Card>)}</> : null}
    <SectionTitle>Công cụ dự án</SectionTitle>
    <View style={styles.grid}>{menu.map(([label, icon, route]) => <Pressable key={route} style={styles.menu} onPress={() => router.push(`/project/${projectId}/${route}` as any)}><Ionicons name={icon as any} size={24} color="#4da3ff" /><Text style={styles.menuText}>{label}</Text></Pressable>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({ stats: { flexDirection: 'row', gap: 8 }, num: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' }, row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, itemTitle: { flex: 1, color: '#eef2f6', fontWeight: '800' }, count: { color: '#f5f7fa', fontWeight: '900', fontSize: 18 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, menu: { width: '47%', minHeight: 92, borderWidth: 1, borderColor: '#202a35', borderRadius: 16, padding: 14, backgroundColor: '#111820', gap: 10 }, menuText: { color: '#eef2f6', fontWeight: '800' } });
