import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Muted,
  Pill,
  SectionTitle,
} from "@/components/ui/primitives";
import { Screen } from "@/components/ui/screen";
import { agentsApi } from "@/services/api";

export default function AgentsScreen() {
  const qc = useQueryClient();
  const agents = useQuery({ queryKey: ["agents"], queryFn: agentsApi.list });
  const actions = useQuery({
    queryKey: ["ai-actions"],
    queryFn: agentsApi.actions,
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("custom");
  const create = useMutation({
    mutationFn: () =>
      agentsApi.create({
        name: name.trim(),
        provider,
        autonomyLevel: "REQUIRE_APPROVAL",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["agents"] });
      setOpen(false);
      setName("");
    },
    onError: showError,
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      agentsApi.update(id, { isActive: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
    onError: showError,
  });
  const revert = useMutation({
    mutationFn: agentsApi.revert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-actions"] }),
    onError: showError,
  });
  const actionItems = Array.isArray(actions.data)
    ? actions.data
    : (actions.data?.actions ?? []);
  return (
    <Screen
      title="Agents"
      subtitle={`${agents.data?.length ?? 0} agents`}
      right={<Button title="+ Agent" onPress={() => setOpen(true)} />}
      refreshing={agents.isRefetching}
      onRefresh={() => {
        void agents.refetch();
        void actions.refetch();
      }}
    >
      {(agents.data ?? []).map((agent) => (
        <Card key={agent.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{agent.name}</Text>
              <Muted>
                {agent.provider} · {agent.autonomy_level}
              </Muted>
            </View>
            <Pill text={agent.is_active ? "ACTIVE" : "OFFLINE"} />
          </View>
          <Button
            kind="secondary"
            title={agent.is_active ? "Tắt agent" : "Bật agent"}
            onPress={() =>
              toggle.mutate({ id: agent.id, active: !agent.is_active })
            }
          />
        </Card>
      ))}
      <SectionTitle>AI Actions</SectionTitle>
      {actionItems.slice(0, 30).map((action) => (
        <Card key={action.id}>
          <View style={styles.row}>
            <Pill text={action.status} />
            <Text style={styles.title}>{action.action_type}</Text>
          </View>
          <Muted>
            {action.target_identifier ?? action.target_id} ·{" "}
            {action.agent_name ?? action.agent_id}
          </Muted>
          {action.status === "EXECUTED" ? (
            <Button
              kind="secondary"
              title="Revert"
              onPress={() => revert.mutate(action.id)}
            />
          ) : null}
        </Card>
      ))}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tạo Agent</Text>
            <Field placeholder="Tên" value={name} onChangeText={setName} />
            <Field
              placeholder="Provider"
              value={provider}
              onChangeText={setProvider}
            />
            <Button
              title="Tạo"
              disabled={!name.trim() || !provider.trim() || create.isPending}
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
function showError(error: unknown) {
  Alert.alert(
    "Không thể cập nhật agent",
    error instanceof Error ? error.message : "Có lỗi xảy ra",
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { flex: 1, color: "#eef2f6", fontWeight: "800" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0009" },
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
