import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill, SectionTitle } from '@/components/ui/primitives';
import { LoadingScreen, Screen } from '@/components/ui/screen';
import { issuesApi, projectsApi } from '@/services/api';

type CreateMode = 'cycle' | 'milestone' | null;

export default function PlanningScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ['project', projectId], queryFn: () => projectsApi.get(projectId!), enabled: !!projectId });
  const cycles = useQuery({ queryKey: ['cycles', projectId], queryFn: () => projectsApi.cycles(projectId!), enabled: !!projectId });
  const milestones = useQuery({ queryKey: ['milestones', projectId], queryFn: () => projectsApi.milestones(projectId!), enabled: !!projectId });
  const issues = useQuery({ queryKey: ['issues', projectId], queryFn: () => issuesApi.list({ projectId, limit: 200 }), enabled: !!projectId });
  const [mode, setMode] = useState<CreateMode>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const createCycle = useMutation({ mutationFn: () => projectsApi.createCycle(projectId!, { name: name.trim(), startsAt: start, endsAt: end }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['cycles', projectId] }); setMode(null); reset(); }, onError: showError });
  const createMilestone = useMutation({ mutationFn: () => projectsApi.createMilestone({ projectId, title: name.trim(), startDate: start || undefined, targetDate: end }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['milestones', projectId] }); setMode(null); reset(); }, onError: showError });
  const reset = () => { setName(''); setStart(''); setEnd(''); };
  const scheduled = useMemo(() => (issues.data ?? []).filter((i) => i.scheduled_start).sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()), [issues.data]);
  if (project.isLoading) return <LoadingScreen />;

  return <Screen title={`Planning · ${project.data?.key ?? ''}`} subtitle="Cycles, milestones & schedule" refreshing={cycles.isRefetching || milestones.isRefetching} onRefresh={() => { void cycles.refetch(); void milestones.refetch(); void issues.refetch(); }}>
    <View style={styles.actions}><Button title="+ Cycle" onPress={() => setMode('cycle')} /><Button kind="secondary" title="+ Milestone" onPress={() => setMode('milestone')} /></View>
    <SectionTitle>Cycles</SectionTitle>
    {(cycles.data ?? []).map((cycle) => <Card key={cycle.id}><View style={styles.row}><Text style={styles.title}>{cycle.name || `Cycle ${cycle.number}`}</Text><Pill text={cycle.status} /></View><Muted>{new Date(cycle.start_date).toLocaleDateString('vi-VN')} → {new Date(cycle.end_date).toLocaleDateString('vi-VN')}</Muted></Card>)}
    <SectionTitle>Milestones</SectionTitle>
    {(milestones.data ?? []).map((m) => <Card key={m.id}><View style={styles.row}><Text style={styles.title}>{m.title}</Text><Pill text={m.health_status} /></View><Muted>Target {new Date(m.target_date).toLocaleDateString('vi-VN')} · {m.status}</Muted></Card>)}
    <SectionTitle>Schedule</SectionTitle>
    {scheduled.slice(0, 30).map((issue) => <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}><Card><View style={styles.row}><Pill text={issue.identifier} /><Text style={styles.time}>{new Date(issue.scheduled_start!).toLocaleString('vi-VN')}</Text></View><Text style={styles.title}>{issue.title}</Text><Muted>{issue.focus_hours ? `${Number(issue.focus_hours)}h focus` : 'Scheduled'}</Muted></Card></Pressable>)}
    <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => setMode(null)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>{mode === 'cycle' ? 'Tạo Cycle' : 'Tạo Milestone'}</Text><Field placeholder="Tên" value={name} onChangeText={setName} /><Field placeholder="Start: 2026-09-04" value={start} onChangeText={setStart} /><Field placeholder={mode === 'cycle' ? 'End: 2026-09-18' : 'Target: 2026-09-18'} value={end} onChangeText={setEnd} /><Button title="Tạo" disabled={!name.trim() || !end || (mode === 'cycle' && !start)} onPress={() => mode === 'cycle' ? createCycle.mutate() : createMilestone.mutate()} /><Button kind="secondary" title="Hủy" onPress={() => setMode(null)} /></View></View></Modal>
  </Screen>;
}

function showError(error: unknown) { Alert.alert('Không thể lưu', error instanceof Error ? error.message : 'Có lỗi xảy ra'); }
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, title: { flex: 1, color: '#eef2f6', fontWeight: '800' }, time: { color: '#9eabb7', fontSize: 12 }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }, sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' } });
