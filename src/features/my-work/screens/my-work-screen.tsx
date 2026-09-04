import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Muted, Pill } from '@/shared/components/ui/primitives';
import { EmptyState, Screen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';
import { useMyWork } from '../hooks/use-my-work';

export default function MyWorkScreen() {
  const { user, orgId } = useAuth();
  const { query, issues, sections } = useMyWork(orgId, user?.id);

  return (
    <Screen
      title="My Work"
      subtitle={`${issues.length} công việc`}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {issues.length === 0 ? (
        <EmptyState title="Không có công việc" />
      ) : (
        sections.map(([title, list]) =>
          list.length ? (
            <View key={title} style={styles.section}>
              <Text style={styles.sectionTitle}>{title} · {list.length}</Text>
              {list.slice(0, 12).map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}
                >
                  <Card>
                    <View style={styles.row}>
                      <Pill text={issue.identifier} />
                      <Pill text={issue.priority} />
                    </View>
                    <Text style={styles.title}>{issue.title}</Text>
                    <Muted>
                      {issue.status?.name ?? '-'}
                      {issue.due_date ? ` · Hạn ${new Date(issue.due_date).toLocaleDateString('vi-VN')}` : ''}
                    </Muted>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null,
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9 },
  sectionTitle: { color: '#eef2f6', fontSize: 17, fontWeight: '900', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#f3f6f9', fontWeight: '800' },
});
