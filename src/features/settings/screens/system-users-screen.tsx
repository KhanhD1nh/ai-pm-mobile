import { showAppAlert } from "@/shared/feedback/app-alert";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { Button, Field, Pill } from "@/shared/components/ui/primitives";
import {
  BottomSheet,
  GlassIconButton,
  SectionHeader,
} from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import { Screen } from "@/shared/components/ui/screen";
import type { AppTheme } from "@/shared/components/ui/theme";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import { useSystemUsers } from "../queries/use-system-users";
import {
  useCreateSystemUser,
  useDeleteSystemUser,
} from "../mutations/use-system-user-mutations";

export default function SystemUsersScreen() {
  const { user, orgId } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const isOwner = Boolean(user?.isSystemOwner || user?.is_system_owner);
  const users = useSystemUsers(isOwner);
  const pullRefresh = usePullToRefresh(() => users.refetch());
  const create = useCreateSystemUser();
  const remove = useDeleteSystemUser();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const onError = (error: unknown) =>
    presentError(
      language === "vi" ? "Không thể cập nhật user" : "Could not update user",
      error,
    );

  if (!isOwner)
    return (
      <Screen chrome="stack" title="System Users">
        <Text style={{ color: ui.colors.textSecondary }}>
          {language === "vi"
            ? "Chỉ System Owner có quyền truy cập."
            : "Only System Owners can access this screen."}
        </Text>
      </Screen>
    );
  const submit = () =>
    create.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        password,
        orgId: orgId ?? undefined,
        role: "MEMBER",
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEmail("");
          setPassword("");
        },
        onError,
      },
    );

  return (
    <Screen
      chrome="stack"
      title="System Users"
      subtitle={`${users.data?.length ?? 0} users`}
      scroll={false}
      right={
        <GlassIconButton
          icon="person-add-outline"
          label={language === "vi" ? "Tạo user" : "New user"}
          onPress={() => setOpen(true)}
        />
      }
    >
      <FlatList
        data={users.data ?? []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={pullRefresh.refreshing}
        onRefresh={pullRefresh.onRefresh}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <SectionHeader
            title={language === "vi" ? "Tài khoản hệ thống" : "System accounts"}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.border} />}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.isSystemOwner ? (
                  <Pill text="OWNER" tone="accent" />
                ) : null}
              </View>
              <Text style={styles.email}>{item.email}</Text>
              {(item.workspaces ?? []).length ? (
                <Text style={styles.workspaces} numberOfLines={1}>
                  {(item.workspaces ?? [])
                    .map(
                      (workspace) => `${workspace.orgName} · ${workspace.role}`,
                    )
                    .join("  •  ")}
                </Text>
              ) : null}
            </View>
            {!item.isSystemOwner ? (
              <MotionPressable
                onPress={() =>
                  showAppAlert(
                    language === "vi" ? "Xóa user?" : "Delete user?",
                    item.email,
                    [
                      { text: language === "vi" ? "Hủy" : "Cancel" },
                      {
                        text: language === "vi" ? "Xóa" : "Delete",
                        style: "destructive",
                        onPress: () => remove.mutate(item.id, { onError }),
                      },
                    ],
                  )
                }
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={ui.colors.danger}
                />
              </MotionPressable>
            ) : null}
          </View>
        )}
      />

      <BottomSheet
        visible={open}
        title={language === "vi" ? "Tạo System User" : "Create System User"}
        onClose={() => setOpen(false)}
        footer={
          <Button
            title={language === "vi" ? "Tạo user" : "Create user"}
            disabled={
              !name.trim() ||
              !email.trim() ||
              password.length < 8 ||
              create.isPending
            }
            onPress={submit}
          />
        }
      >
        <Field
          placeholder={language === "vi" ? "Tên" : "Name"}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Field
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          placeholder={
            language === "vi"
              ? "Mật khẩu (tối thiểu 8 ký tự)"
              : "Password (8+ characters)"
          }
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    listContent: { paddingBottom: 24 },
    userRow: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    border: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ui.colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surfaceRaised,
    },
    avatarText: { color: ui.colors.textSecondary, fontWeight: "700" },
    copy: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    name: { flexShrink: 1, color: ui.colors.text, ...ui.typography.bodyStrong },
    email: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      marginTop: 2,
    },
    workspaces: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      fontSize: 12,
      marginTop: 4,
    },
    deleteButton: {
      width: Platform.OS === "android" ? 48 : 44,
      height: Platform.OS === "android" ? 48 : 44,
      borderRadius: Platform.OS === "android" ? 16 : 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.dangerSoft,
    },
  });
