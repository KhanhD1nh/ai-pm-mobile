import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Muted, Pill } from '@/shared/components/ui/primitives';
import { EmptyState, Screen } from '@/shared/components/ui/screen';
import type { NotificationItem } from '@/shared/contracts';
import { NOTIFICATION_FILTERS, type NotificationFilter } from '../model/notification-filter';
import { useNotificationInbox } from '../hooks/use-notification-inbox';

function routeNotification(notification: NotificationItem) {
  const identifier = String(notification.payload?.issueIdentifier ?? notification.payload?.identifier ?? '');
  if (notification.entity_type === 'ISSUE' && identifier) {
    router.push({ pathname: '/issue/[identifier]', params: { identifier } });
    return;
  }
  if (notification.project_id) {
    router.push({ pathname: '/project/[projectId]', params: { projectId: notification.project_id } });
  }
}

export default function InboxScreen() {
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const { notifications, unread, markAll, items, prepareOpen, refresh } = useNotificationInbox(filter);

  const open = async (notification: NotificationItem) => {
    await prepareOpen(notification);
    routeNotification(notification);
  };

  return (
    <Screen
      title="Inbox"
      subtitle={`${unread.data?.unread ?? 0} chưa đọc`}
      right={<Button kind="secondary" title="Đọc hết" onPress={() => markAll.mutate()} />}
      refreshing={notifications.isRefetching}
      onRefresh={() => void refresh()}
    >
      <View style={styles.filters}>
        {NOTIFICATION_FILTERS.map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {items.length === 0 ? (
        <EmptyState title="Không có thông báo" />
      ) : (
        items.map((notification) => (
          <Pressable key={notification.id} onPress={() => void open(notification)}>
            <Card>
              <View style={styles.row}>
                <View style={[styles.dot, notification.read && styles.dotRead]} />
                <Text style={styles.title}>{notification.title || notification.type}</Text>
                <Pill text={notification.priority} />
              </View>
              {notification.body ? <Muted>{notification.body}</Muted> : null}
              <Muted>{new Date(notification.created_at).toLocaleString('vi-VN')}</Muted>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  filter: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#151e27' },
  filterActive: { backgroundColor: '#2388ff' },
  filterText: { color: '#8e9ba8', fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4da3ff' },
  dotRead: { backgroundColor: '#394551' },
  title: { flex: 1, color: '#eef2f6', fontWeight: '800' },
});
