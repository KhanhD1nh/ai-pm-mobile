import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Muted } from '@/shared/components/ui/primitives';
import { Screen } from '@/shared/components/ui/screen';
import { useAuth } from '@/providers/auth-provider';

const items = [
  { label: 'Search', detail: 'Tìm issue và project', icon: 'search-outline', href: '/search' },
  { label: 'Agents', detail: 'AI agents và actions', icon: 'sparkles-outline', href: '/agents' },
  { label: 'Profile', detail: 'Thông tin cá nhân và bảo mật', icon: 'person-outline', href: '/settings/profile' },
  { label: 'Organization', detail: 'Workspace và members', icon: 'business-outline', href: '/settings/organization' },
  { label: 'AI Budget', detail: 'Giới hạn và theo dõi chi phí AI', icon: 'wallet-outline', href: '/settings/ai-budget' },
  { label: 'System Users', detail: 'Quản trị tài khoản toàn hệ thống', icon: 'people-circle-outline', href: '/settings/users' },
  { label: 'Mobile settings', detail: 'Notification, biometric, device', icon: 'phone-portrait-outline', href: '/settings/mobile' },
] as const;

export default function MoreScreen() {
  const { organizations, orgId, selectOrganization, logout, user } = useAuth();
  const current = organizations.find((x) => x.id === orgId);
  return <Screen title="More" subtitle={user?.email}>
    <Text style={styles.heading}>Workspace</Text>
    <View style={styles.wrap}>{organizations.map((org) => <Pressable key={org.id} onPress={() => void selectOrganization(org.id)} style={[styles.workspace, current?.id === org.id && styles.workspaceActive]}><Text style={styles.workspaceName}>{org.name}</Text><Muted>{org.role ?? 'SYSTEM OWNER'}</Muted></Pressable>)}</View>
    <Text style={styles.heading}>Công cụ</Text>
    {items.map((item) => <Pressable key={item.href} onPress={() => router.push(item.href as any)}><Card><View style={styles.row}><Ionicons name={item.icon as any} size={22} color="#4da3ff" /><View style={{ flex: 1 }}><Text style={styles.title}>{item.label}</Text><Muted>{item.detail}</Muted></View><Ionicons name="chevron-forward" size={18} color="#667482" /></View></Card></Pressable>)}
    <Pressable onPress={() => void logout()}><Card><Text style={[styles.title, { color: '#f06d78' }]}>Đăng xuất</Text></Card></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({ heading: { color: '#eef2f6', fontSize: 16, fontWeight: '900', marginTop: 7 }, wrap: { gap: 8 }, workspace: { borderRadius: 14, borderWidth: 1, borderColor: '#202a35', padding: 12, backgroundColor: '#111820' }, workspaceActive: { borderColor: '#2388ff' }, workspaceName: { color: '#eef2f6', fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, title: { color: '#eef2f6', fontWeight: '800' } });
