import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Field, Pill } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  ChoiceRow,
  ListGroup,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import type { Organization } from "@/shared/contracts";
import {
  useAiBudget,
  useOrganizationMembers,
} from "../queries/use-organization-admin";
import {
  useAddOrganizationMember,
  useRemoveOrganizationMember,
  useUpdateOrganization,
  useUpdateOrganizationMember,
} from "../mutations/use-organization-mutations";

const roles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export default function OrganizationScreen() {
  const { organizations, orgId, refreshOrganizations } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const org = organizations.find((item) => item.id === orgId);
  const members = useOrganizationMembers(orgId);
  const budget = useAiBudget(orgId);
  const updateOrg = useUpdateOrganization(orgId);
  const addMember = useAddOrganizationMember(orgId);
  const updateMember = useUpdateOrganizationMember(orgId);
  const removeMember = useRemoveOrganizationMember(orgId);
  const pullRefresh = usePullToRefresh(() =>
    Promise.all([members.refetch(), budget.refetch()]),
  );
  const [email, setEmail] = useState("");
  const [memberSheet, setMemberSheet] = useState<any | null>(null);

  if (!org)
    return (
      <Screen
        chrome="stack"
        title={language === "vi" ? "Workspace" : "Workspace"}
      >
        <Text style={{ color: ui.colors.textSecondary }}>
          {language === "vi"
            ? "Chưa chọn workspace."
            : "No workspace selected."}
        </Text>
      </Screen>
    );

  const onError = (error: unknown) =>
    presentError(
      language === "vi"
        ? "Không thể cập nhật workspace"
        : "Could not update workspace",
      error,
    );
  const saveWorkspace = (name: string) =>
    updateOrg.mutate(name, {
      onSuccess: async () => {
        await refreshOrganizations();
        Alert.alert(language === "vi" ? "Đã lưu workspace" : "Workspace saved");
      },
      onError,
    });
  const addWorkspaceMember = () =>
    addMember.mutate(
      { email: email.trim(), role: "MEMBER" },
      { onSuccess: () => setEmail(""), onError },
    );
  const usage = budget.data?.currentUsageUsd ?? 0;
  const limit = budget.data?.monthlyUsdLimit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

  return (
    <Screen
      chrome="stack"
      title={org.name}
      subtitle={org.role ?? "System Owner"}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      <OrganizationNameForm
        key={`${org.id}-${org.name}`}
        organization={org}
        saving={updateOrg.isPending}
        onSubmit={saveWorkspace}
        language={language}
      />

      <SectionHeader title="AI Budget" caption={`${pct}%`} />
      <View style={styles.budgetCard}>
        <View style={styles.budgetTop}>
          <View>
            <Text style={styles.budgetLabel}>
              {language === "vi" ? "Đã dùng" : "Used"}
            </Text>
            <Text style={styles.budgetValue}>${usage.toFixed(2)}</Text>
          </View>
          <View style={styles.budgetRight}>
            <Text style={styles.budgetLabel}>
              {language === "vi" ? "Giới hạn" : "Limit"}
            </Text>
            <Text style={styles.budgetLimit}>${limit.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.budgetMeta}>
          {language === "vi"
            ? `Cảnh báo ở ${budget.data?.alertThresholdPct ?? 80}% · reset ngày ${budget.data?.resetDay ?? 1}`
            : `Alert at ${budget.data?.alertThresholdPct ?? 80}% · resets on day ${budget.data?.resetDay ?? 1}`}
        </Text>
      </View>

      <SectionHeader
        title={language === "vi" ? "Thành viên workspace" : "Workspace members"}
        caption={`${members.data?.length ?? 0}`}
      />
      <View style={styles.addRow}>
        <Field
          placeholder={
            language === "vi" ? "Email thành viên mới" : "New member email"
          }
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={{ flex: 1 }}
        />
        <Button
          title={language === "vi" ? "Thêm" : "Add"}
          disabled={!email.trim() || addMember.isPending}
          onPress={addWorkspaceMember}
        />
      </View>
      <ListGroup variant="plain">
        {(members.data ?? []).map((member: any, index) => {
          const memberName =
            member.name ?? member.user?.name ?? member.email ?? "User";
          const memberEmail = member.email ?? member.user?.email ?? "";
          return (
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={`${memberName}, ${memberEmail}, ${member.role}`}
              key={member.id}
              onPress={() =>
                setMemberSheet({
                  ...member,
                  displayName: memberName,
                  displayEmail: memberEmail,
                })
              }
              style={[styles.memberRow, index > 0 && styles.border]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {memberName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{memberName}</Text>
                <Text style={styles.email}>{memberEmail}</Text>
              </View>
              <Pill
                text={member.role}
                tone={member.role === "OWNER" ? "accent" : "neutral"}
              />
              <Ionicons
                accessible={false}
                name="chevron-forward"
                size={17}
                color={ui.colors.textMuted}
              />
            </MotionPressable>
          );
        })}
      </ListGroup>

      <BottomSheet
        visible={Boolean(memberSheet)}
        title={memberSheet?.displayName ?? ""}
        subtitle={memberSheet?.displayEmail}
        onClose={() => setMemberSheet(null)}
      >
        {roles.map((role) => (
          <ChoiceRow
            key={role}
            label={role}
            active={memberSheet?.role === role}
            onPress={() =>
              memberSheet &&
              updateMember.mutate(
                { id: memberSheet.id, role },
                {
                  onSuccess: () => setMemberSheet({ ...memberSheet, role }),
                  onError,
                },
              )
            }
          />
        ))}
        <MotionPressable
          accessibilityRole="button"
          onPress={() =>
            memberSheet &&
            Alert.alert(
              language === "vi"
                ? "Xóa khỏi workspace?"
                : "Remove from workspace?",
              memberSheet.displayName,
              [
                { text: language === "vi" ? "Hủy" : "Cancel" },
                {
                  text: language === "vi" ? "Xóa" : "Remove",
                  style: "destructive",
                  onPress: () =>
                    removeMember.mutate(memberSheet.id, {
                      onSuccess: () => setMemberSheet(null),
                      onError,
                    }),
                },
              ],
            )
          }
          style={styles.removeRow}
        >
          <Ionicons
            accessible={false}
            name="person-remove-outline"
            size={18}
            color={ui.colors.danger}
          />
          <Text style={styles.removeText}>
            {language === "vi" ? "Xóa khỏi workspace" : "Remove from workspace"}
          </Text>
        </MotionPressable>
      </BottomSheet>
    </Screen>
  );
}

function OrganizationNameForm({
  organization,
  saving,
  onSubmit,
  language,
}: {
  organization: Organization;
  saving: boolean;
  onSubmit: (name: string) => void;
  language: "vi" | "en";
}) {
  const [name, setName] = useState(organization.name);
  return (
    <>
      <SectionHeader
        title={language === "vi" ? "Thông tin workspace" : "Workspace details"}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Field value={name} onChangeText={setName} style={{ flex: 1 }} />
        <Button
          title={saving ? "…" : language === "vi" ? "Lưu" : "Save"}
          disabled={!name.trim() || saving || name.trim() === organization.name}
          onPress={() => onSubmit(name.trim())}
        />
      </View>
    </>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    budgetCard: {
      gap: 12,
      padding: 16,
      borderRadius: ui.radius.lg,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
    },
    budgetTop: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    budgetRight: { alignItems: "flex-end" },
    budgetLabel: { color: ui.colors.textMuted, ...ui.typography.caption },
    budgetValue: {
      color: ui.colors.text,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: -0.7,
      marginTop: 2,
    },
    budgetLimit: {
      color: ui.colors.textSecondary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 2,
    },
    track: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: ui.colors.surfaceRaised,
    },
    progress: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: ui.colors.accent,
    },
    budgetMeta: { color: ui.colors.textMuted, ...ui.typography.caption },
    addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    memberRow: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 11,
    },
    border: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ui.colors.border,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    avatarText: { color: ui.colors.textSecondary, fontWeight: "700" },
    copy: { flex: 1, minWidth: 0 },
    name: { color: ui.colors.text, ...ui.typography.bodyStrong },
    email: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    removeRow: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 13,
      borderRadius: ui.radius.md,
      backgroundColor: ui.colors.dangerSoft,
      marginTop: 8,
    },
    removeText: { color: ui.colors.danger, ...ui.typography.bodyStrong },
  });
