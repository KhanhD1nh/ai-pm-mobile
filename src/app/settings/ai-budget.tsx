import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Field, Label, Muted } from '@/components/ui/primitives';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
import { organizationsApi } from '@/services/api';

export default function AiBudgetScreen() {
  const { orgId } = useAuth();
  const qc = useQueryClient();
  const budget = useQuery({ queryKey: ['ai-budget', orgId], queryFn: () => organizationsApi.aiBudget(orgId!), enabled: !!orgId });
  const [limit, setLimit] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [resetDay, setResetDay] = useState('1');
  useEffect(() => { if (budget.data) { setLimit(String(budget.data.monthlyUsdLimit)); setThreshold(String(budget.data.alertThresholdPct)); setResetDay(String(budget.data.resetDay)); } }, [budget.data]);
  const save = useMutation({ mutationFn: () => organizationsApi.updateAiBudget(orgId!, { monthlyUsdLimit: Number(limit), alertThresholdPct: Number(threshold), resetDay: Number(resetDay) }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['ai-budget', orgId] }); Alert.alert('Đã cập nhật AI Budget'); }, onError: (e) => Alert.alert('Không thể lưu', e instanceof Error ? e.message : 'Có lỗi xảy ra') });
  const usage = budget.data?.currentUsageUsd ?? 0;
  const monthly = budget.data?.monthlyUsdLimit ?? 0;
  const pct = monthly > 0 ? Math.min(100, Math.round((usage / monthly) * 100)) : 0;
  return <Screen title="AI Budget" subtitle="Workspace AI cost governance">
    <Card><View style={styles.row}><View><Muted>Đã dùng</Muted><Text style={styles.big}>${usage.toFixed(2)}</Text></View><View><Muted>Giới hạn</Muted><Text style={styles.big}>${monthly.toFixed(2)}</Text></View></View><View style={styles.track}><View style={[styles.progress, { width: `${pct}%` }]} /></View><Muted>{pct}% ngân sách tháng</Muted></Card>
    <Card><Label>Monthly limit (USD)</Label><Field keyboardType="decimal-pad" value={limit} onChangeText={setLimit} /><Label>Alert threshold (%)</Label><Field keyboardType="number-pad" value={threshold} onChangeText={setThreshold} /><Label>Reset day</Label><Field keyboardType="number-pad" value={resetDay} onChangeText={setResetDay} /><Button title={save.isPending ? 'Đang lưu...' : 'Lưu budget'} disabled={save.isPending || !Number.isFinite(Number(limit))} onPress={() => save.mutate()} /></Card>
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between' }, big: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' }, track: { height: 8, borderRadius: 999, backgroundColor: '#25313d', overflow: 'hidden' }, progress: { height: '100%', backgroundColor: '#2388ff' } });
