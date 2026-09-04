import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Card, Field, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { issuesApi, projectsApi } from '@/services/api';

export default function SearchScreen() {
  const { orgId } = useAuth();
  const [q, setQ] = useState('');
  const projects = useQuery({ queryKey: ['projects', orgId], queryFn: projectsApi.list, enabled: !!orgId });
  const issues = useQuery({ queryKey: ['global-search', orgId, q], queryFn: () => issuesApi.list({ q: q.trim(), limit: 50 }), enabled: !!orgId && q.trim().length >= 2 });
  const filteredProjects = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return (projects.data ?? []).filter((p) => p.name.toLowerCase().includes(term) || p.key.toLowerCase().includes(term));
  }, [projects.data, q]);

  return <Screen title="Search" subtitle="Issues & projects">
    <Field autoFocus placeholder="Tìm issue, project..." value={q} onChangeText={setQ} />
    {filteredProjects.length > 0 ? <><SectionTitle>Projects</SectionTitle>{filteredProjects.map((p) => <Pressable key={p.id} onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: p.id } })}><Card><Text style={styles.title}>{p.name}</Text><Pill text={p.key} /></Card></Pressable>)}</> : null}
    {(issues.data?.length ?? 0) > 0 ? <><SectionTitle>Issues</SectionTitle>{issues.data!.map((issue) => <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}><Card><Text style={styles.title}>{issue.title}</Text><Muted>{issue.identifier} · {issue.status?.name ?? '—'} · {issue.priority}</Muted></Card></Pressable>)}</> : null}
    {q.trim().length > 0 && q.trim().length < 2 ? <Muted>Nhập ít nhất 2 ký tự.</Muted> : null}
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: '#eef2f6', fontWeight: '800' } });
