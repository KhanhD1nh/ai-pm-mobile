import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Muted, Pill } from '@/shared/components/ui/primitives';
import { EmptyState, Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import { useProjects } from '../queries/use-projects';
import { useCreateProject } from '../mutations/use-project-mutations';

export default function ProjectsScreen() {
  const { orgId } = useAuth();
  const projects = useProjects(orgId);
  const create = useCreateProject();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => create.mutate(
    {
      key: key.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
    },
    {
      onSuccess: (project) => {
        setOpen(false);
        setKey('');
        setName('');
        setDescription('');
        router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } });
      },
      onError: (error) => presentError('Không thể tạo dự án', error),
    },
  );

  return (
    <Screen
      title="Projects"
      subtitle={`${projects.data?.length ?? 0} dự án`}
      right={<Button title="+ Tạo" onPress={() => setOpen(true)} />}
      refreshing={projects.isRefetching}
      onRefresh={() => void projects.refetch()}
    >
      {projects.data?.length === 0 ? <EmptyState title="Chưa có dự án" body="Tạo dự án đầu tiên để bắt đầu." /> : null}
      {(projects.data ?? []).map((project) => (
        <Pressable
          key={project.id}
          onPress={() => router.push({ pathname: '/project/[projectId]', params: { projectId: project.id } })}
        >
          <Card>
            <View style={styles.row}>
              <Text style={styles.title}>{project.name}</Text>
              <Pill text={project.key} />
            </View>
            {project.description ? <Muted>{project.description}</Muted> : null}
            <Muted>{project.issue_counter} issues</Muted>
          </Card>
        </Pressable>
      ))}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo dự án</Text>
            <Field placeholder="Key (VD: AIPM)" autoCapitalize="characters" value={key} onChangeText={setKey} />
            <Field placeholder="Tên dự án" value={name} onChangeText={setName} />
            <Field placeholder="Mô tả" multiline value={description} onChangeText={setDescription} />
            <Button title={create.isPending ? 'Đang tạo...' : 'Tạo dự án'} disabled={!key.trim() || !name.trim() || create.isPending} onPress={submit} />
            <Button kind="secondary" title="Hủy" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: '#f5f7fa', fontWeight: '800', fontSize: 17 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: { backgroundColor: '#10171f', padding: 20, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  sheetTitle: { color: '#f5f7fa', fontSize: 22, fontWeight: '900' },
});
