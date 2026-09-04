import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Card, Field, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';
import { useGlobalSearch } from '../hooks/use-global-search';

export default function SearchScreen() {
  const { orgId } = useAuth();
  const [query, setQuery] = useState('');
  const result = useGlobalSearch(orgId, query);

  return (
    <Screen title="Search" subtitle="Issues & projects">
      <Field autoFocus placeholder="Tìm issue, project..." value={query} onChangeText={setQuery} />
      {result.projects.length > 0 ? (
        <>
          <SectionTitle>Projects</SectionTitle>
          {result.projects.map((project) => (
            <Pressable key={project.id} onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } })}>
              <Card><Text style={styles.title}>{project.name}</Text><Pill text={project.key} /></Card>
            </Pressable>
          ))}
        </>
      ) : null}
      {result.issues.length > 0 ? (
        <>
          <SectionTitle>Issues</SectionTitle>
          {result.issues.map((issue) => (
            <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}>
              <Card><Text style={styles.title}>{issue.title}</Text><Muted>{issue.identifier} · {issue.status?.name ?? '—'} · {issue.priority}</Muted></Card>
            </Pressable>
          ))}
        </>
      ) : null}
      {query.trim().length > 0 && query.trim().length < 2 ? <Muted>Nhập ít nhất 2 ký tự.</Muted> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { color: '#eef2f6', fontWeight: '800' } });
