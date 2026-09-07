import { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/shared/components/ui/primitives';
import { ListGroup, ListRow, SectionHeader } from '@/shared/components/ui/mobile';
import { ErrorState, LoadingScreen, Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { presentError } from '@/shared/errors/present-error';
import { usePullToRefresh } from '@/shared/hooks/use-pull-to-refresh';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { useCreateTelegramLink, useTelegramSettings, useUnlinkTelegram, useUpdateTelegramPreference } from '../public';
import type { TelegramPreferenceKey } from '../contracts';

const preferenceRows: { key: TelegramPreferenceKey; vi: string; en: string; detailVi: string; detailEn: string }[] = [
  { key: 'notificationsEnabled', vi: 'Thông báo Telegram', en: 'Telegram notifications', detailVi: 'Bật hoặc tắt toàn bộ thông báo qua Telegram.', detailEn: 'Enable or disable all Telegram notifications.' },
  { key: 'notifyAssigned', vi: 'Task được giao', en: 'Task assigned', detailVi: 'Khi bạn được gán vào một task.', detailEn: 'When a task is assigned to you.' },
  { key: 'notifyDeadline', vi: 'Deadline', en: 'Deadline reminders', detailVi: 'Nhắc các deadline quan trọng.', detailEn: 'Important deadline reminders.' },
  { key: 'notifyStatusChange', vi: 'Thay đổi trạng thái', en: 'Status changes', detailVi: 'Khi trạng thái task thay đổi.', detailEn: 'When an issue status changes.' },
  { key: 'notifyComments', vi: 'Bình luận', en: 'Comments', detailVi: 'Khi có bình luận mới liên quan tới bạn.', detailEn: 'When a relevant new comment is posted.' },
];

export default function TelegramSettingsScreen() {
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const settings = useTelegramSettings();
  const createLink = useCreateTelegramLink();
  const unlink = useUnlinkTelegram();
  const updatePreference = useUpdateTelegramPreference();
  const pullRefresh = usePullToRefresh(() => settings.refetch());
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);

  useEffect(() => {
    if (!linkUrl) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void settings.refetch();
    });
    return () => subscription.remove();
  }, [linkUrl, settings]);

  const connect = async () => {
    try {
      const result = await createLink.mutateAsync();
      setLinkUrl(result.linkUrl);
      setPairCode(result.pairCode ?? null);
      await Linking.openURL(result.linkUrl);
    } catch (error) {
      presentError(language === 'vi' ? 'Không thể mở liên kết Telegram' : 'Could not open Telegram link', error);
    }
  };

  const changePreference = (key: TelegramPreferenceKey, value: boolean) => {
    updatePreference.mutate({ key, value }, {
      onError: (error) => presentError(language === 'vi' ? 'Không thể cập nhật thông báo Telegram' : 'Could not update Telegram notifications', error),
    });
  };

  const confirmUnlink = () => Alert.alert(
    language === 'vi' ? 'Hủy liên kết Telegram?' : 'Unlink Telegram?',
    language === 'vi' ? 'Bạn sẽ ngừng nhận thông báo Telegram cho tới khi liên kết lại.' : 'You will stop receiving Telegram notifications until you reconnect.',
    [
      { text: language === 'vi' ? 'Hủy' : 'Cancel' },
      {
        text: language === 'vi' ? 'Hủy liên kết' : 'Unlink',
        style: 'destructive',
        onPress: () => unlink.mutate(undefined, {
          onSuccess: () => {
            setLinkUrl(null);
            setPairCode(null);
          },
          onError: (error) => presentError(language === 'vi' ? 'Không thể hủy liên kết Telegram' : 'Could not unlink Telegram', error),
        }),
      },
    ],
  );

  const data = settings.data;
  if (settings.isLoading && !data) return <LoadingScreen title="Telegram" chrome="stack" />;
  if (settings.isError && !data) {
    return (
      <Screen chrome="stack" title="Telegram">
        <ErrorState
          title={language === 'vi' ? 'Không tải được Telegram' : 'Could not load Telegram'}
          body={language === 'vi' ? 'Kiểm tra kết nối rồi thử lại.' : 'Check your connection and try again.'}
          onRetry={() => void settings.refetch()}
        />
      </Screen>
    );
  }
  return (
    <Screen
      chrome="stack"
      title="Telegram"
      subtitle={data?.linked ? (data.telegramUsername ? `@${data.telegramUsername}` : (language === 'vi' ? 'Đã liên kết' : 'Connected')) : (language === 'vi' ? 'Tài khoản & thông báo' : 'Account & notifications')}
      refreshing={pullRefresh.refreshing}
      onRefresh={pullRefresh.onRefresh}
    >
      {!data?.linked ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{language === 'vi' ? 'Kết nối AI-PM với Telegram' : 'Connect AI-PM with Telegram'}</Text>
            <Text style={styles.heroBody}>{language === 'vi' ? 'Nhận cập nhật task trên Telegram và mở nhanh issue trong ứng dụng AI-PM.' : 'Receive task updates in Telegram and jump directly into issues in AI-PM.'}</Text>
            <Button title={createLink.isPending ? (language === 'vi' ? 'Đang tạo liên kết…' : 'Creating link…') : (language === 'vi' ? 'Kết nối Telegram' : 'Connect Telegram')} disabled={createLink.isPending} onPress={() => void connect()} />
          </View>

          {pairCode ? (
            <>
              <SectionHeader title={language === 'vi' ? 'Ghép đôi thủ công' : 'Manual pairing'} caption={language === 'vi' ? 'Dùng mã này nếu Telegram không hoàn tất liên kết tự động.' : 'Use this code if Telegram does not finish linking automatically.'} />
              <View style={styles.codeBox}><Text selectable style={styles.code}>{pairCode}</Text></View>
            </>
          ) : null}

          {linkUrl ? (
            <ListGroup>
              <ListRow first icon="paper-plane-outline" label={language === 'vi' ? 'Mở lại Telegram' : 'Open Telegram again'} onPress={() => void Linking.openURL(linkUrl)} />
              <ListRow icon="refresh-outline" label={language === 'vi' ? 'Kiểm tra kết nối' : 'Check connection'} onPress={() => void settings.refetch()} />
            </ListGroup>
          ) : null}
        </>
      ) : (
        <>
          <SectionHeader title={language === 'vi' ? 'Tài khoản đã liên kết' : 'Connected account'} />
          <ListGroup>
            <ListRow first icon="paper-plane-outline" label={data.telegramUsername ? `@${data.telegramUsername}` : (language === 'vi' ? 'Telegram đã liên kết' : 'Linked Telegram account')} detail={data.telegramLinkedAt ? `${language === 'vi' ? 'Liên kết' : 'Linked'} ${new Date(data.telegramLinkedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}` : undefined} value={language === 'vi' ? 'Đã kết nối' : 'Connected'} />
          </ListGroup>

          <SectionHeader title={language === 'vi' ? 'Thông báo' : 'Notifications'} caption={language === 'vi' ? 'Thay đổi được lưu tự động' : 'Changes are saved automatically'} />
          <ListGroup>
            {preferenceRows.map((row, index) => {
              const masterOff = row.key !== 'notificationsEnabled' && !data.notificationsEnabled;
              return (
                <ListRow
                  key={row.key}
                  first={index === 0}
                  icon={row.key === 'notificationsEnabled' ? 'notifications-outline' : 'ellipse-outline'}
                  label={language === 'vi' ? row.vi : row.en}
                  detail={language === 'vi' ? row.detailVi : row.detailEn}
                  trailing={<Switch accessibilityLabel={language === 'vi' ? row.vi : row.en} value={Boolean(data[row.key])} disabled={masterOff || updatePreference.isPending} onValueChange={(value) => changePreference(row.key, value)} trackColor={{ true: ui.colors.accent }} />}
                />
              );
            })}
          </ListGroup>

          <SectionHeader title={language === 'vi' ? 'Tài khoản' : 'Account'} />
          <ListGroup>
            <ListRow first icon="unlink-outline" label={language === 'vi' ? 'Hủy liên kết Telegram' : 'Unlink Telegram'} detail={language === 'vi' ? 'Ngừng nhận thông báo trên tài khoản Telegram này.' : 'Stop notifications to this Telegram account.'} danger onPress={unlink.isPending ? undefined : confirmUnlink} />
          </ListGroup>
        </>
      )}
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  hero: { gap: 12, paddingVertical: 8 },
  heroTitle: { color: ui.colors.text, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heroBody: { color: ui.colors.textSecondary, ...ui.typography.body, lineHeight: 22 },
  codeBox: { minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: ui.radius.lg, backgroundColor: ui.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.border },
  code: { color: ui.colors.accent, fontSize: 25, fontWeight: '800', letterSpacing: 5 },
});
