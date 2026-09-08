import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/shared/components/ui/screen';
import { BottomSheet, ChoiceRow, ListGroup, ListRow } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import type { AppTheme } from '@/shared/components/ui/theme';
import {
  useAppPreferences,
  type AppLanguage,
  type ThemePreference,
} from '@/shared/preferences/app-preferences-context';
import { useAuth } from '@/providers/auth-provider';

type PreferenceSheet = 'theme' | 'language' | null;

export default function MoreScreen() {
  const { organizations, orgId, selectOrganization, logout, user } = useAuth();
  const {
    theme: ui,
    themePreference,
    language,
    setThemePreference,
    setLanguage,
    t,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [preferenceSheet, setPreferenceSheet] = useState<PreferenceSheet>(null);
  const current = organizations.find((x) => x.id === orgId);
  const isSystemOwner = Boolean(user?.isSystemOwner || user?.is_system_owner);
  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('common.system') },
    { value: 'light', label: t('common.light') },
    { value: 'dark', label: t('common.dark') },
  ];
  const languageOptions: { value: AppLanguage; label: string; detail: string }[] = [
    { value: 'vi', label: 'Tiếng Việt', detail: 'VI' },
    { value: 'en', label: 'English', detail: 'EN' },
  ];
  const currentThemeLabel = themeOptions.find((x) => x.value === themePreference)?.label ?? t('common.system');
  const currentLanguageLabel = language === 'vi' ? 'Tiếng Việt' : 'English';

  return (
    <Screen title={t('more.title')}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={t('more.profile')}
        onPress={() => router.push('/settings/profile')}
        style={styles.profile}
      >
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{user?.name || 'AI-PM user'}</Text>
          <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
        </View>
        <Ionicons accessible={false} name="chevron-forward" size={17} color={ui.colors.textMuted} />
      </MotionPressable>

      <SectionLabel text={language === 'vi' ? 'Ứng dụng' : 'App'} ui={ui} />
      <ListGroup>
        <ListRow first icon="color-palette-outline" label={t('more.theme')} value={currentThemeLabel} onPress={() => setPreferenceSheet('theme')} />
        <ListRow icon="language-outline" label={t('more.language')} value={currentLanguageLabel} onPress={() => setPreferenceSheet('language')} />
        {Platform.OS === 'ios' ? (
          <ListRow icon="water-outline" label="Liquid Glass" detail={language === 'vi' ? 'Theo Cài đặt > Màn hình & Độ sáng > Liquid Glass' : 'Follows Settings > Display & Brightness > Liquid Glass'} value={language === 'vi' ? 'Hệ thống' : 'System'} />
        ) : null}
        <ListRow icon="phone-portrait-outline" label={t('more.mobileSettings')} detail={t('more.mobileSettingsDetail')} onPress={() => router.push('/settings/mobile')} />
      </ListGroup>

      <SectionLabel text={language === 'vi' ? 'Workspace' : 'Workspace'} ui={ui} />
      <ListGroup>
        {organizations.map((org, index) => {
          const active = current?.id === org.id;
          return (
            <ListRow
              key={org.id}
              first={index === 0}
              icon="business-outline"
              label={org.name}
              detail={org.role ?? 'SYSTEM OWNER'}
              trailing={active ? <Ionicons accessible={false} name="checkmark" size={19} color={ui.colors.accentStrong} /> : undefined}
              onPress={() => void selectOrganization(org.id)}
            />
          );
        })}
      </ListGroup>

      <SectionLabel text="AI-PM" ui={ui} />
      <ListGroup>
        <ListRow first icon="search-outline" label={t('more.search')} detail={t('more.searchDetail')} onPress={() => router.push('/search')} />
        <ListRow icon="sparkles-outline" label={t('more.agents')} detail={t('more.agentsDetail')} onPress={() => router.push('/agents')} />
      </ListGroup>

      <SectionLabel text={language === 'vi' ? 'Quản trị' : 'Administration'} ui={ui} />
      <ListGroup>
        <ListRow first icon="business-outline" label={t('more.organization')} detail={t('more.organizationDetail')} onPress={() => router.push('/settings/organization')} />
        <ListRow icon="wallet-outline" label={t('more.aiBudget')} detail={t('more.aiBudgetDetail')} onPress={() => router.push('/settings/ai-budget')} />
        {isSystemOwner ? <ListRow icon="people-outline" label={t('more.systemUsers')} detail={t('more.systemUsersDetail')} onPress={() => router.push('/settings/users')} /> : null}
        {isSystemOwner ? <ListRow icon="paper-plane-outline" label="Telegram Bot" detail={language === 'vi' ? 'Token, trạng thái và webhook hệ thống' : 'System bot token, status, and webhook'} onPress={() => router.push('/settings/telegram-admin' as never)} /> : null}
      </ListGroup>

      <ListGroup>
        <ListRow first icon="log-out-outline" label={t('more.logout')} danger onPress={() => void logout()} />
      </ListGroup>

      <BottomSheet visible={preferenceSheet === 'theme'} title={t('more.theme')} onClose={() => setPreferenceSheet(null)}>
        {themeOptions.map((option) => (
          <ChoiceRow
            key={option.value}
            label={option.label}
            active={themePreference === option.value}
            onPress={() => {
              void setThemePreference(option.value);
              setPreferenceSheet(null);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={preferenceSheet === 'language'} title={t('more.language')} onClose={() => setPreferenceSheet(null)}>
        {languageOptions.map((option) => (
          <ChoiceRow
            key={option.value}
            label={option.label}
            description={option.detail}
            active={language === option.value}
            onPress={() => {
              void setLanguage(option.value);
              setPreferenceSheet(null);
            }}
          />
        ))}
      </BottomSheet>

    </Screen>
  );
}

function SectionLabel({ text, ui }: { text: string; ui: AppTheme }) {
  const styles = useMemo(() => createStyles(ui), [ui]);
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  profile: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  avatarText: { color: ui.colors.text, fontSize: 17, fontWeight: '700' },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: ui.colors.text, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  profileEmail: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  sectionLabel: { color: ui.colors.textMuted, ...ui.typography.eyebrow, textTransform: 'uppercase', marginTop: 10, marginBottom: -2, paddingHorizontal: 2 },
});
