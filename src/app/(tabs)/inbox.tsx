import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, Card, Muted, Pill } from '@/components/ui/primitives';
import { EmptyState, Screen } from '@/components/ui/screen';
import { settingsApi } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';
import type { NotificationItem } from '@/types';

const filters = ['ALL', 'UNREAD', 'ASSIGNED', 'MENTIONS', 'ALERTS', 'AI'] as const;
type Filter = typeof filters[number];

function matches(filter: Filter, n: NotificationItem) {
  if (filter === 'UNREAD') return !n.read;
  if (filter === 'ASSIGNED') return n.type.includes('ASSIGNED');
  if (filter === 'MENTIONS') return n.type.includes('MENTION');
  if (filter === 'ALERTS') return ['OVERDUE', 'DUE_SOON', 'AT_RISK', 'CI_FAILED', 'PROJECT_ALERT'].some((x) => n.type.includes(x));
  if (filter === 'AI') return n.type.startsWith('AI_');
  return true;
}

function routeNotification(n: NotificationItem) {
  const identifier = String(n.payload?.issueIdentifier ?? n.payload?.identifier ?? '');
  if (n.entity_type === 'ISSUE' && identifier) return router.push({ pathname: '/issue/[identifier]', params: { identifier } });
  if (n.project_id) return router.push({ pathname: '/project/[projectId]', params: { projectId: n.project_id } });
}

export default function InboxScreen() {
  const qc = useQueryClient();
  const { orgId, selectOrganization } = useAuth();
  const [filter, setFilter] = useState<Filter>('ALL');
  const query = useQuery({ queryKey: ['notifications'], queryFn: () => settingsApi.notifications(false) });
  const unread = useQuery({ queryKey: ['notification-unread'], queryFn: settingsApi.unreadCount });
  const markRead = useMutation({ mutationFn: settingsApi.markRead, onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['notifications'] }), qc.invalidateQueries({ queryKey: ['notification-unread'] })]); } });
  const markAll = useMutation({ mutationFn: settingsApi.markAllRead, onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: ['notifications'] }), qc.invalidateQueries({ queryKey: ['notification-unread'] })]); } });
  const items = useMemo(() => (query.data ?? []).filter((n) => matches(filter, n)), [query.data, filter]);

  const open = async (n: NotificationItem) => {
    if (n.org_id && n.org_id !== orgId) {
      await selectOrganization(n.org_id);
      await qc.invalidateQueries();
    }
    if (!n.read) markRead.mutate(n.id);
    routeNotification(n);
  };

  return <Screen title="Inbox" subtitle={`${unread.data?.unread ?? 0} chưa đọc`} right={<Button kind="secondary" title="Đọc hết" onPress={() => markAll.mutate()} />} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); void unread.refetch(); }}>
    <View style={styles.filters}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
    {items.length === 0 ? <EmptyState title="Không có thông báo" /> : items.map((n) => <Pressable key={n.id} onPress={() => open(n)}><Card><View style={styles.row}><View style={[styles.dot, n.read && styles.dotRead]} /><Text style={styles.title}>{n.title || n.type}</Text><Pill text={n.priority} /></View>{n.body ? <Muted>{n.body}</Muted> : null}<Muted>{new Date(n.created_at).toLocaleString('vi-VN')}</Muted></Card></Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({ filters: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, filter: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#151e27' }, filterActive: { backgroundColor: '#2388ff' }, filterText: { color: '#8e9ba8', fontSize: 11, fontWeight: '800' }, filterTextActive: { color: '#fff' }, row: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4da3ff' }, dotRead: { backgroundColor: '#394551' }, title: { flex: 1, color: '#eef2f6', fontWeight: '800' } });
