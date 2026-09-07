import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BottomSheet, ChoiceRow, GlassIconButton } from '@/shared/components/ui/mobile';
import { EmptyState, ErrorState, Screen } from '@/shared/components/ui/screen';
import { MotionPressable } from '@/shared/components/ui/motion';
import type { AppTheme } from '@/shared/components/ui/theme';
import { usePullToRefresh } from '@/shared/hooks/use-pull-to-refresh';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import type { NotificationItem } from '@/shared/contracts';
import { NOTIFICATION_FILTERS, type NotificationFilter } from '../model/notification-filter';
import { useNotificationInbox } from '../hooks/use-notification-inbox';

function routeNotification(notification: NotificationItem) {
  const identifier = String(notification.payload?.issueIdentifier ?? notification.payload?.identifier ?? '');
  if (notification.entity_type === 'ISSUE' && identifier) {
    router.push({ pathname: '/issue/[identifier]', params: { identifier } });
    return;
  }
  if (notification.project_id) router.push({ pathname: '/project/[projectId]', params: { projectId: notification.project_id } });
}

const PRIMARY_FILTERS: NotificationFilter[] = ['ALL', 'UNREAD', 'MENTIONS'];

export default function InboxScreen() {
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const { theme: ui, language, t } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { notifications, unread, markAll, items, prepareOpen, refresh } = useNotificationInbox(filter);
  const pullRefresh = usePullToRefresh(refresh);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const filterLabels: Record<NotificationFilter, string> = language === 'vi'
    ? { ALL: 'Tất cả', UNREAD: 'Chưa đọc', ASSIGNED: 'Được giao', MENTIONS: 'Nhắc đến', ALERTS: 'Cảnh báo', AI: 'AI' }
    : { ALL: 'All', UNREAD: 'Unread', ASSIGNED: 'Assigned', MENTIONS: 'Mentions', ALERTS: 'Alerts', AI: 'AI' };
  const secondaryFilters = NOTIFICATION_FILTERS.filter((item) => !PRIMARY_FILTERS.includes(item));
  const secondaryActive = secondaryFilters.includes(filter);

  const open = async (notification: NotificationItem) => {
    await prepareOpen(notification);
    routeNotification(notification);
  };

  return (
    <Screen scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(notification) => notification.id}
        showsVerticalScrollIndicator={false}
        refreshing={pullRefresh.refreshing}
        onRefresh={pullRefresh.onRefresh}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (notifications.hasNextPage && !notifications.isFetchingNextPage) void notifications.fetchNextPage();
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View style={styles.headerBlock}>
            <View style={styles.appBar}>
              <View style={styles.headingCopy}>
                <Text style={styles.heading}>{t('inbox.title')}</Text>
                <Text style={styles.headingMeta}>{unread.data?.unread ?? 0} {t('inbox.unread')}</Text>
              </View>
              <View style={styles.headerActionSafeArea}>
                <GlassIconButton
                  icon="checkmark-done-outline"
                  label={language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}
                  disabled={(unread.data?.unread ?? 0) === 0 || markAll.isPending}
                  onPress={() => markAll.mutate()}
                />
              </View>
            </View>
            <View style={styles.filterRow}>
              {PRIMARY_FILTERS.map((item) => {
                const active = filter === item;
                return (
                  <MotionPressable key={item} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFilter(item)} style={[styles.filter, active && styles.filterActive]}>
                    <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>{filterLabels[item]}</Text>
                  </MotionPressable>
                );
              })}
              <MotionPressable accessibilityRole="button" accessibilityLabel={language === 'vi' ? 'Bộ lọc khác' : 'More filters'} accessibilityState={{ selected: secondaryActive }} onPress={() => setShowFilters(true)} style={[styles.moreFilter, secondaryActive && styles.filterActive]}>
                <Ionicons accessible={false} name="options-outline" size={18} color={secondaryActive ? ui.colors.accentStrong : ui.colors.textSecondary} />
              </MotionPressable>
            </View>
            {secondaryActive ? (
              <View style={styles.activeFilterLine}>
                <Text style={styles.activeFilterLabel}>{filterLabels[filter]}</Text>
                <MotionPressable accessibilityRole="button" onPress={() => setFilter('ALL')}><Text style={styles.clearFilter}>{language === 'vi' ? 'Xóa' : 'Clear'}</Text></MotionPressable>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={notifications.isLoading
          ? <View style={styles.loadingState}><ActivityIndicator color={ui.colors.accentStrong} /></View>
          : notifications.isError
            ? <ErrorState title={language === 'vi' ? 'Không thể tải thông báo' : 'Could not load notifications'} onRetry={() => void notifications.refetch()} />
            : <EmptyState title={t('inbox.empty')} />}
        ListFooterComponent={notifications.isFetchingNextPage
          ? <View style={styles.pageLoader}><ActivityIndicator color={ui.colors.accentStrong} /></View>
          : null}
        ItemSeparatorComponent={() => <View style={styles.notificationBorder} />}
        renderItem={({ item: notification }) => (
          <MotionPressable accessibilityRole="button" accessibilityLabel={notification.title || notification.type} onPress={() => void open(notification)} style={styles.notification}>
            <View style={[styles.unreadRail, notification.read && styles.unreadRailRead]} />
            <View style={[styles.icon, !notification.read && styles.iconUnread]}>
              <Ionicons accessible={false} name={notification.read ? 'notifications-outline' : 'notifications'} size={18} color={notification.read ? ui.colors.textMuted : ui.colors.accentStrong} />
            </View>
            <View style={styles.copy}>
              <View style={styles.topRow}>
                <Text style={[styles.title, !notification.read && styles.titleUnread]} numberOfLines={2}>{notification.title || notification.type}</Text>
                {notification.priority && notification.priority !== 'NORMAL' ? <Text style={styles.priority}>{notification.priority}</Text> : null}
              </View>
              {notification.body ? <Text style={styles.body} numberOfLines={2}>{notification.body}</Text> : null}
              <Text style={styles.time}>{new Date(notification.created_at).toLocaleString(locale)}</Text>
            </View>
            <Ionicons accessible={false} name="chevron-forward" size={16} color={ui.colors.textMuted} />
          </MotionPressable>
        )}
      />

      <BottomSheet visible={showFilters} title={language === 'vi' ? 'Bộ lọc thông báo' : 'Notification filters'} onClose={() => setShowFilters(false)}>
        {secondaryFilters.map((item) => (
          <ChoiceRow
            key={item}
            label={filterLabels[item]}
            active={filter === item}
            onPress={() => { setFilter(item); setShowFilters(false); }}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  listContent: { paddingBottom: 24 },
  loadingState: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  pageLoader: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  headerBlock: { gap: 16, paddingBottom: 4 },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 7 },
  headingCopy: { flex: 1, minWidth: 0 },
  heading: { color: ui.colors.text, ...ui.typography.screenTitle },
  headingMeta: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  headerActionSafeArea: { flexShrink: 0, paddingRight: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filter: { flex: 1, minWidth: 0, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 13, backgroundColor: ui.colors.surfaceRaised },
  filterActive: { backgroundColor: ui.colors.accentSoft },
  filterText: { maxWidth: '100%', color: ui.colors.textSecondary, ...ui.typography.caption, fontSize: 11.5 },
  filterTextActive: { color: ui.colors.accentStrong, fontWeight: '600' },
  moreFilter: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  activeFilterLine: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activeFilterLabel: { color: ui.colors.textSecondary, ...ui.typography.caption },
  clearFilter: { color: ui.colors.accentStrong, ...ui.typography.caption, fontWeight: '600' },
  notification: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13 },
  notificationBorder: { height: StyleSheet.hairlineWidth, backgroundColor: ui.colors.border },
  unreadRail: { width: 3, height: 42, borderRadius: 2, backgroundColor: ui.colors.accentStrong },
  unreadRailRead: { backgroundColor: 'transparent' },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  iconUnread: { backgroundColor: ui.colors.accentSoft },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, color: ui.colors.textSecondary, ...ui.typography.bodyStrong },
  titleUnread: { color: ui.colors.text },
  priority: { color: ui.colors.warning, fontSize: 10, lineHeight: 14, fontWeight: '600' },
  body: { color: ui.colors.textSecondary, ...ui.typography.body, fontSize: 13, lineHeight: 19 },
  time: { color: ui.colors.textMuted, ...ui.typography.caption, fontSize: 10.5 },
});
