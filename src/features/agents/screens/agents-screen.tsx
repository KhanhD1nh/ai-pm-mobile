import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Field, Pill } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  GlassIconButton,
  ListGroup,
  ListRow,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import { env } from "@/config/env";
import { useAgents, useAiActions } from "../queries/use-agents";
import {
  useCreateAgent,
  useRevertAiAction,
  useToggleAgent,
} from "../mutations/use-agent-mutations";

export default function AgentsScreen() {
  const { theme: ui, language } = useAppPreferences();
  const { orgId } = useAuth();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const agents = useAgents(orgId);
  const actions = useAiActions(orgId);
  const create = useCreateAgent(orgId);
  const toggle = useToggleAgent(orgId);
  const revert = useRevertAiAction(orgId);
  const pullRefresh = usePullToRefresh(() =>
    Promise.all([agents.refetch(), actions.refetch()]),
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("custom");
  const [createdCredential, setCreatedCredential] = useState<{
    name: string;
    token: string;
  } | null>(null);
  const actionItems = Array.isArray(actions.data)
    ? actions.data
    : (actions.data?.actions ?? []);

  const createAgent = () =>
    create.mutate(
      { name: name.trim(), provider, autonomyLevel: "REQUIRE_APPROVAL" },
      {
        onSuccess: (agent) => {
          setOpen(false);
          setName("");
          if (agent.token)
            setCreatedCredential({ name: agent.name, token: agent.token });
        },
        onError: (error) =>
          presentError(
            language === "vi"
              ? "Không thể tạo agent"
              : "Could not create agent",
            error,
          ),
      },
    );

  return (
    <Screen
      chrome="stack"
      title="Agents"
      subtitle={`${agents.data?.length ?? 0} agents`}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
      right={
        <GlassIconButton
          icon="add"
          label={language === "vi" ? "Tạo agent" : "New agent"}
          onPress={() => setOpen(true)}
        />
      }
    >
      <SectionHeader
        title="Agents"
        caption={
          language === "vi"
            ? "Bật hoặc tạm dừng agent mà không thu hồi token"
            : "Enable or pause agents without revoking their token"
        }
      />
      <ListGroup>
        <ListRow
          first
          icon="compass-outline"
          label={language === "vi" ? "Hướng dẫn tích hợp" : "Integration guide"}
          detail={
            language === "vi"
              ? "MCP, AI-PM Skills và quy trình xác minh agent"
              : "MCP, AI-PM Skills, and agent verification"
          }
          onPress={() => router.push("/agents/guide" as never)}
        />
      </ListGroup>
      <ListGroup variant="plain">
        {(agents.data ?? []).map((agent, index) => (
          <View
            key={agent.id}
            style={[styles.agentRow, index > 0 && styles.border]}
          >
            <View
              style={[
                styles.agentIcon,
                agent.is_active && styles.agentIconActive,
              ]}
            >
              <Ionicons
                accessible={false}
                name="sparkles-outline"
                size={18}
                color={agent.is_active ? ui.colors.accent : ui.colors.textMuted}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{agent.name}</Text>
              <Text style={styles.detail}>
                {agent.provider} · {agent.autonomy_level} ·{" "}
                {agent.is_active
                  ? language === "vi"
                    ? "Đang hoạt động"
                    : "Active"
                  : language === "vi"
                    ? "Tạm dừng"
                    : "Paused"}
              </Text>
            </View>
            <MotionPressable
              accessibilityRole="switch"
              accessibilityState={{ checked: agent.is_active }}
              accessibilityLabel={`${agent.name} ${agent.is_active ? "on" : "off"}`}
              onPress={() =>
                toggle.mutate(
                  { id: agent.id, active: !agent.is_active },
                  {
                    onError: (error) =>
                      presentError(
                        language === "vi"
                          ? "Không thể cập nhật agent"
                          : "Could not update agent",
                        error,
                      ),
                  },
                )
              }
              style={[styles.toggle, agent.is_active && styles.toggleActive]}
            >
              <Text
                style={[
                  styles.toggleText,
                  agent.is_active && styles.toggleTextActive,
                ]}
              >
                {agent.is_active ? "ON" : "OFF"}
              </Text>
            </MotionPressable>
          </View>
        ))}
      </ListGroup>

      <SectionHeader
        title="AI Actions"
        caption={language === "vi" ? "Hoạt động gần đây" : "Recent activity"}
      />
      <ListGroup variant="plain">
        {actionItems.slice(0, 30).map((action, index) => (
          <View
            key={action.id}
            style={[styles.actionRow, index > 0 && styles.border]}
          >
            <View style={styles.actionTop}>
              <Pill
                text={action.status}
                tone={action.status === "EXECUTED" ? "success" : "neutral"}
              />
              <Text style={styles.actionType}>{action.action_type}</Text>
            </View>
            <Text style={styles.actionDetail}>
              {action.target_identifier ?? action.target_id} ·{" "}
              {action.agent_name ?? action.agent_id}
            </Text>
            {action.status === "EXECUTED" ? (
              <MotionPressable
                accessibilityRole="button"
                onPress={() =>
                  revert.mutate(action.id, {
                    onError: (error) =>
                      presentError(
                        language === "vi"
                          ? "Không thể revert"
                          : "Could not revert",
                        error,
                      ),
                  })
                }
                style={styles.revertButton}
              >
                <Text style={styles.revert}>
                  {language === "vi" ? "Hoàn tác" : "Revert"}
                </Text>
              </MotionPressable>
            ) : null}
          </View>
        ))}
      </ListGroup>

      <BottomSheet
        visible={open}
        title={language === "vi" ? "Tạo agent" : "Create agent"}
        onClose={() => setOpen(false)}
        footer={
          <Button
            title={language === "vi" ? "Tạo agent" : "Create agent"}
            disabled={!name.trim() || !provider.trim() || create.isPending}
            onPress={createAgent}
          />
        }
      >
        <Field
          placeholder={language === "vi" ? "Tên agent" : "Agent name"}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Field
          placeholder="Provider"
          value={provider}
          onChangeText={setProvider}
        />
        <ListRow
          first
          icon="shield-checkmark-outline"
          label={language === "vi" ? "Mức tự chủ" : "Autonomy"}
          value="REQUIRE_APPROVAL"
        />
      </BottomSheet>

      <BottomSheet
        visible={Boolean(createdCredential)}
        title={language === "vi" ? "Lưu Agent Token" : "Save Agent Token"}
        subtitle={createdCredential?.name}
        onClose={() => setCreatedCredential(null)}
        footer={
          <Button
            title={language === "vi" ? "Tôi đã lưu token" : "I saved the token"}
            onPress={() => setCreatedCredential(null)}
          />
        }
      >
        <Text style={styles.credentialWarning}>
          {language === "vi"
            ? "Token này chỉ được hiển thị sau khi tạo agent. Hãy lưu ở nơi an toàn và không gửi vào chat/log."
            : "This token is shown after agent creation. Store it securely and never paste it into chat/logs."}
        </Text>
        <Text style={styles.credentialLabel}>Bearer token</Text>
        <Text selectable style={styles.credentialCode}>
          {createdCredential?.token}
        </Text>
        <Text style={styles.credentialLabel}>MCP endpoint</Text>
        <Text
          selectable
          style={styles.credentialCode}
        >{`${env.apiBaseUrl}/mcp`}</Text>
        <ListGroup>
          <ListRow
            first
            icon="compass-outline"
            label={
              language === "vi"
                ? "Mở hướng dẫn MCP & Skills"
                : "Open MCP & Skills guide"
            }
            onPress={() => {
              setCreatedCredential(null);
              router.push("/agents/guide" as never);
            }}
          />
        </ListGroup>
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    agentRow: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    border: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    agentIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    agentIconActive: { backgroundColor: ui.colors.accentSoft },
    copy: { flex: 1, minWidth: 0 },
    title: { color: ui.colors.text, ...ui.typography.bodyStrong },
    detail: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 3,
    },
    toggle: {
      minWidth: 58,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    toggleActive: { backgroundColor: ui.colors.accentSoft },
    toggleText: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontWeight: "700",
    },
    toggleTextActive: { color: ui.colors.accent },
    actionRow: { paddingVertical: 13, gap: 7 },
    actionTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    actionType: { flex: 1, color: ui.colors.text, ...ui.typography.bodyStrong },
    actionDetail: { color: ui.colors.textMuted, ...ui.typography.caption },
    revertButton: {
      alignSelf: "flex-start",
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    revert: {
      color: ui.colors.accent,
      ...ui.typography.caption,
      fontWeight: "700",
    },
    credentialWarning: {
      color: ui.colors.warning,
      ...ui.typography.body,
      lineHeight: 22,
    },
    credentialLabel: {
      color: ui.colors.textMuted,
      ...ui.typography.eyebrow,
      marginTop: 4,
    },
    credentialCode: {
      color: ui.colors.text,
      fontFamily: "monospace",
      fontSize: 12.5,
      lineHeight: 19,
      padding: 12,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.surfaceRaised,
    },
  });
