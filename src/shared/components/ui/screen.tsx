import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, title, subtitle, right, scroll = true, refreshing, onRefresh }: PropsWithChildren<{ title?: string; subtitle?: string; right?: ReactNode; scroll?: boolean; refreshing?: boolean; onRefresh?: () => void }>) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {(title || right) && <View style={styles.header}><View style={{ flex: 1 }}>{title ? <Text style={styles.title}>{title}</Text> : null}{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right}</View>}
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function LoadingScreen() { return <SafeAreaView style={[styles.root, styles.center]}><ActivityIndicator size="large" /></SafeAreaView>; }
export function EmptyState({ title, body }: { title: string; body?: string }) { return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text>{body ? <Text style={styles.subtitle}>{body}</Text> : null}</View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0f14' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  title: { color: '#f5f7fa', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#8f9ba8', marginTop: 3, fontSize: 13 },
  scroll: { paddingBottom: 32 },
  content: { paddingHorizontal: 16, gap: 12 },
  empty: { paddingVertical: 42, alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#dfe5ec', fontSize: 16, fontWeight: '700' },
});
