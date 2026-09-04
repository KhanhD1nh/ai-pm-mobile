import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';
import { useHomeDashboard } from '../hooks/use-home-dashboard';

export default function HomeScreen() {
  const { user, organizations, orgId } = useAuth();
  const org = organizations.find((item) => item.id === orgId);
  const { projects, unread, mine, overdue, inProgress, refreshing, refresh } = useHomeDashboard(orgId, user?.id);

  return (
    <Screen
      title={`Xin chào, ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle={org?.name ?? 'AI-PM'}
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <View style={styles.stats}>
        <Card><Text style={styles.number}>{mine.length}</Text><Muted>Công việc của tôi</Muted></Card>
        <Card><Text style={styles.number}>{overdue.length}</Text><Muted>Quá hạn</Muted></Card>
        <Card><Text style={styles.number}>{unread.data?.unread ?? 0}</Text><Muted>Chưa đọc</Muted></Card>
      </View>

      <SectionTitle>Đang thực hiện</SectionTitle>
      {inProgress.slice(0, 5).map((issue) => (
        <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}>
          <Card>
            <View style={styles.row}><Pill text={issue.identifier} /><Pill text={issue.priority} /></View>
            <Text style={styles.title}>{issue.title}</Text>
            {issue.due_date ? <Muted>Hạn {new Date(issue.due_date).toLocaleDateString('vi-VN')}</Muted> : null}
          </Card>
        </Pressable>
      ))}

      <SectionTitle>Dự án</SectionTitle>
      {(projects.data ?? []).slice(0, 6).map((project) => (
        <Pressable key={project.id} onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } })}>
          <Card>
            <View style={styles.row}><Text style={styles.title}>{project.name}</Text><Pill text={project.key} /></View>
            {project.description ? <Muted>{project.description}</Muted> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  number: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: '#f3f6f9', fontSize: 15, fontWeight: '800' },
});
