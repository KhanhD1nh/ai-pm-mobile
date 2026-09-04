import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Muted, Pill } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import type { StatusCategory } from '@/shared/contracts';
import { useWorkflow } from '../queries/use-workflow';
import { useCreateWorkflowStatus, useDeleteWorkflowStatus, useUpdateWorkflowStatus } from '../mutations/use-workflow-mutations';

const categories: StatusCategory[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELED', 'REJECTED'];

export default function WorkflowScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, ordered } = useWorkflow(projectId);
  const create = useCreateWorkflowStatus(projectId);
  const update = useUpdateWorkflowStatus(projectId);
  const remove = useDeleteWorkflowStatus(projectId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StatusCategory>('TODO');

  const onError = (error: unknown) => presentError('Không thể cập nhật workflow', error);
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const current = ordered[index]!;
    const next = ordered[target]!;
    update.mutate({ id: current.id, data: { position: next.position } }, { onError });
    update.mutate({ id: next.id, data: { position: current.position } }, { onError });
  };

  const createStatus = () => create.mutate(
    { name: name.trim(), category, position: ordered.length + 1 },
    {
      onSuccess: () => {
        setOpen(false);
        setName('');
      },
      onError,
    },
  );

  return (
    <Screen title={`Workflow · ${project.data?.key ?? ''}`} subtitle="Quản lý thứ tự Board" right={<Button title="+ Status" onPress={() => setOpen(true)} />}>
      {ordered.map((status, index) => (
        <Card key={status.id}>
          <View style={styles.row}>
            <Pill text={`${index + 1}`} />
            <View style={{ flex: 1 }}><Text style={styles.title}>{status.name}</Text><Muted>{status.category}</Muted></View>
            {status.is_default ? <Pill text="DEFAULT" /> : null}
          </View>
          <View style={styles.actions}>
            <Button kind="secondary" title="↑" onPress={() => move(index, -1)} />
            <Button kind="secondary" title="↓" onPress={() => move(index, 1)} />
            <Button
              kind="danger"
              title="Xóa"
              onPress={() => Alert.alert('Xóa status?', status.name, [
                { text: 'Hủy' },
                { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(status.id, { onError }) },
              ])}
            />
          </View>
        </Card>
      ))}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo status</Text>
            <Field placeholder="Tên status" value={name} onChangeText={setName} />
            <View style={styles.wrap}>
              {categories.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.choice, category === item && styles.active]}>
                  <Text style={styles.choiceText}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Tạo" disabled={!name.trim() || create.isPending} onPress={createStatus} />
            <Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { color: '#eef2f6', fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  choice: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: '#17212b' },
  active: { backgroundColor: '#2388ff' },
  choiceText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
});
