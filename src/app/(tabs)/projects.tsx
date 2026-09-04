import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Button, Card, Field, Muted, Pill } from "@/components/ui/primitives";
import { EmptyState, Screen } from "@/components/ui/screen";
import { useAuth } from "@/contexts/auth-context";
import { projectsApi } from "@/services/api";

export default function ProjectsScreen() {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  const projects = useQuery({
    queryKey: ["projects", orgId],
    queryFn: projectsApi.list,
    enabled: !!orgId,
  });
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useMutation({
    mutationFn: () =>
      projectsApi.create(
        key.trim().toUpperCase(),
        name.trim(),
        description.trim() || undefined,
      ),
    onSuccess: async (project) => {
      await qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setKey("");
      setName("");
      setDescription("");
      router.push({
        pathname: "/project/[projectId]",
        params: { projectId: project.id },
      });
    },
    onError: (e) =>
      Alert.alert(
        "Không thể tạo dự án",
        e instanceof Error ? e.message : "Có lỗi xảy ra",
      ),
  });

  return (
    <Screen
      title="Projects"
      subtitle={`${projects.data?.length ?? 0} dự án`}
      right={<Button title="+ Tạo" onPress={() => setOpen(true)} />}
      refreshing={projects.isRefetching}
      onRefresh={() => void projects.refetch()}
    >
      {projects.data?.length === 0 ? (
        <EmptyState
          title="Chưa có dự án"
          body="Tạo dự án đầu tiên để bắt đầu."
        />
      ) : null}
      {(projects.data ?? []).map((project) => (
        <Pressable
          key={project.id}
          onPress={() =>
            router.push({
              pathname: "/project/[projectId]",
              params: { projectId: project.id },
            })
          }
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
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo dự án</Text>
            <Field
              placeholder="Key (VD: AIPM)"
              autoCapitalize="characters"
              value={key}
              onChangeText={setKey}
            />
            <Field
              placeholder="Tên dự án"
              value={name}
              onChangeText={setName}
            />
            <Field
              placeholder="Mô tả"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <Button
              title={create.isPending ? "Đang tạo..." : "Tạo dự án"}
              disabled={!key.trim() || !name.trim() || create.isPending}
              onPress={() => create.mutate()}
            />
            <Button
              kind="secondary"
              title="Hủy"
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { flex: 1, color: "#f5f7fa", fontWeight: "800", fontSize: 17 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0008" },
  sheet: {
    backgroundColor: "#10171f",
    padding: 20,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  sheetTitle: { color: "#f5f7fa", fontSize: 22, fontWeight: "900" },
});
