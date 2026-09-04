import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill, SectionTitle } from '@/shared/components/ui/primitives';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { usePlanning } from '../queries/use-planning';
import { useCreateCycle, useCreateMilestone } from '../mutations/use-planning-mutations';

type CreateMode = 'cycle' | 'milestone' | null;

export default function PlanningScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, cycles, milestones, scheduled, refreshing, refresh } = usePlanning(projectId);
  const createCycle = useCreateCycle(projectId);
  const createMilestone = useCreateMilestone(projectId);
  const [mode, setMode] = useState<CreateMode>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const reset = () => {
    setName('');
    setStart('');
    setEnd('');
  };

  const submit = () => {
    const onSuccess = () => {
      setMode(null);
      reset();
    };
    const onError = (error: unknown) => presentError('Không thể lưu', error);

    if (mode === 'cycle') {
      createCycle.mutate({ name: name.trim(), startsAt: start, endsAt: end }, { onSuccess, onError });
      return;
    }
    createMilestone.mutate({ title: name.trim(), startDate: start || undefined, targetDate: end }, { onSuccess, onError });
  };

  if (project.isLoading) return <LoadingScreen />;

  return (
    <Screen
      title={`Planning · ${project.data?.key ?? ''}`}
      subtitle="Cycles, milestones & schedule"
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <View style={styles.actions}>
        <Button title="+ Cycle" onPress={() => setMode('cycle')} />
        <Button kind="secondary" title="+ Milestone" onPress={() => setMode('milestone')} />
      </View>

      <SectionTitle>Cycles</SectionTitle>
      {(cycles.data ?? []).map((cycle) => (
        <Card key={cycle.id}>
          <View style={styles.row}><Text style={styles.title}>{cycle.name || `Cycle ${cycle.number}`}</Text><Pill text={cycle.status} /></View>
          <Muted>{new Date(cycle.start_date).toLocaleDateString('vi-VN')} → {new Date(cycle.end_date).toLocaleDateString('vi-VN')}</Muted>
        </Card>
      ))}

      <SectionTitle>Milestones</SectionTitle>
      {(milestones.data ?? []).map((milestone) => (
        <Card key={milestone.id}>
          <View style={styles.row}><Text style={styles.title}>{milestone.title}</Text><Pill text={milestone.health_status} /></View>
          <Muted>Target {new Date(milestone.target_date).toLocaleDateString('vi-VN')} · {milestone.status}</Muted>
        </Card>
      ))}

      <SectionTitle>Schedule</SectionTitle>
      {scheduled.slice(0, 30).map((issue) => (
        <Pressable key={issue.id} onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}>
          <Card>
            <View style={styles.row}><Pill text={issue.identifier} /><Text style={styles.time}>{new Date(issue.scheduled_start!).toLocaleString('vi-VN')}</Text></View>
            <Text style={styles.title}>{issue.title}</Text>
            <Muted>{issue.focus_hours ? `${Number(issue.focus_hours)}h focus` : 'Scheduled'}</Muted>
          </Card>
        </Pressable>
      ))}

      <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => setMode(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{mode === 'cycle' ? 'Tạo Cycle' : 'Tạo Milestone'}</Text>
            <Field placeholder="Tên" value={name} onChangeText={setName} />
            <Field placeholder="Start: 2026-09-04" value={start} onChangeText={setStart} />
            <Field placeholder={mode === 'cycle' ? 'End: 2026-09-18' : 'Target: 2026-09-18'} value={end} onChangeText={setEnd} />
            <Button title="Tạo" disabled={!name.trim() || !end || (mode === 'cycle' && !start)} onPress={submit} />
            <Button kind="secondary" title="Hủy" onPress={() => setMode(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: '#eef2f6', fontWeight: '800' },
  time: { color: '#9eabb7', fontSize: 12 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
});
