import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/providers/auth-provider";
import { BottomSheet, ChoiceRow } from "@/shared/components/ui/mobile";
import { MotionPressable } from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import { presentError } from "@/shared/errors/present-error";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

export function WorkspaceSwitcher() {
  const { organizations, orgId, selectOrganization } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [open, setOpen] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);
  const current = organizations.find(
    (organization) => organization.id === orgId,
  );
  const currentName = current?.name ?? "AI-PM";

  const handleSelect = async (nextOrgId: string) => {
    if (nextOrgId === orgId) {
      setOpen(false);
      return;
    }

    setSwitchingOrgId(nextOrgId);
    try {
      await selectOrganization(nextOrgId);
      setOpen(false);
    } catch (error) {
      presentError(
        language === "vi"
          ? "Không thể đổi workspace"
          : "Unable to switch workspace",
        error,
      );
    } finally {
      setSwitchingOrgId(null);
    }
  };

  return (
    <>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={
          language === "vi"
            ? `Đổi workspace, hiện tại ${currentName}`
            : `Switch workspace, currently ${currentName}`
        }
        accessibilityState={{ expanded: open }}
        android_ripple={
          Platform.OS === "android"
            ? {
                color: ui.colors.accentSoft,
                borderless: false,
                foreground: true,
              }
            : undefined
        }
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <View style={styles.mark}>
          <Text style={styles.markText}>
            {currentName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {currentName}
        </Text>
        <Ionicons
          accessible={false}
          name="chevron-down"
          size={15}
          color={ui.colors.textMuted}
        />
      </MotionPressable>

      <BottomSheet
        visible={open}
        title={language === "vi" ? "Chọn workspace" : "Choose workspace"}
        subtitle={
          language === "vi"
            ? "Dữ liệu và quyền sẽ chuyển theo workspace bạn chọn."
            : "Data and permissions follow the workspace you choose."
        }
        onClose={() => setOpen(false)}
      >
        {organizations.map((organization) => (
          <ChoiceRow
            key={organization.id}
            label={organization.name}
            description={organization.role}
            active={organization.id === orgId}
            disabled={switchingOrgId !== null}
            onPress={() => void handleSelect(organization.id)}
          />
        ))}
      </BottomSheet>
    </>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    trigger: {
      minHeight: Platform.OS === "android" ? 44 : 40,
      maxWidth: "72%",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
      paddingLeft: 4,
      paddingRight: 10,
      borderRadius: ui.radius.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      backgroundColor: ui.colors.surface,
      overflow: "hidden",
    },
    mark: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.primaryContainer,
    },
    markText: {
      color: ui.colors.onPrimaryContainer,
      fontSize: 13,
      fontWeight: "700",
    },
    name: {
      minWidth: 0,
      flexShrink: 1,
      color: ui.colors.text,
      ...ui.typography.bodyStrong,
      fontSize: 14,
    },
  });
