import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { issuesApi, projectsApi, settingsApi } from '@/services/api';

export default function HomeScreen() {
  const { user, organizations, orgId } = useAuth();
  const org = organizations.find((item) => item.id === orgId);
  const projects = useQuery({ queryKey: ['projects', orgId], queryFn: projectsApi.list, enabled: !!orgId });
  const issues = useQuery({ queryKey: ['my-issues', orgId, user?.id], queryFn: () => issuesApi.list({ assigneeId: user!.id, limit: 100 }), enabled: !!orgId && !!user?.id });
  const unread = useQuery({ queryKey: ['notification-unread'], queryFn: settingsApi.unreadCount, enabled: !!user });
  const now = Date.now();
  const mine = issues.data ?? [];
  const overdue = mine.filter((issue) => issue.due_date && new Date(issue.due_date).getTime() < now && issue.status?.category !== 'DONE');
  const inProgress = mine.filter((issue) => issue.status?.category === 'IN_PROGRESS');

  return (
    <Screen title={`Xin chào, ${user?.name?.split(' ')[0] ?? ''}`} subtitle={org?.name ?? 'AI-PM'} refreshing={projects.isRefetching || issues.isRefetching} onRefresh={() => { void projects.refetch(); void issues.refetch(); void unread.refetch(); }}>
      <View style={styles.stats}>
        <Card><Text style={styles.number}>{mine.length}</Text><Muted>Công việc của tôi</Muted></Card>
        <Card><Text style={styles.number}>{overdue.length}</Text><Muted>Quá hạn</Muted></Card>
        <Card><Text style={styles.number}>{unread.data?.unread ?? 0}</Text><Muted>Chưa đọc</Muted></Card>
      </View>
      <SectionTitle>Đang thực hiện</SectionTitle>
      {inProgress.slice(0, 5).map((issue) => (
        <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}>
          <Card><View style={styles.row}><Pill text={issue.identifier} /><Pill text={issue.priority} /></View><Text style={styles.title}>{issue.title}</Text>{issue.due_date ? <Muted>Hạn {new Date(issue.due_date).toLocaleDateString('vi-VN')}</Muted> : null}</Card>
        </Pressable>
      ))}
      <SectionTitle>Dự án</SectionTitle>
      {(projects.data ?? []).slice(0, 6).map((project) => (
        <Pressable key={project.id} onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } })}>
          <Card><View style={styles.row}><Text style={styles.title}>{project.name}</Text><Pill text={project.key} /></View>{project.description ? <Muted>{project.description}</Muted> : null}</Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ stats: { flexDirection: 'row', gap: 8 }, number: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, title: { flex: 1, color: '#f3f6f9', fontSize: 15, fontWeight: '800' } });
