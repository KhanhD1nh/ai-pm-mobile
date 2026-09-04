import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Label, Muted } from '@/shared/components/ui/primitives';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import type { AiBudget } from '@/shared/contracts';
import { useAiBudget } from '../queries/use-organization-admin';
import { useUpdateAiBudget } from '../mutations/use-organization-mutations';

type BudgetInput = Pick<AiBudget, 'monthlyUsdLimit' | 'alertThresholdPct' | 'resetDay'>;

export default function AiBudgetScreen() {
  const { orgId } = useAuth();
  const budget = useAiBudget(orgId);
  const save = useUpdateAiBudget(orgId);

  if (budget.isLoading) return <LoadingScreen />;

  const usage = budget.data?.currentUsageUsd ?? 0;
  const monthly = budget.data?.monthlyUsdLimit ?? 0;
  const pct = monthly > 0 ? Math.min(100, Math.round((usage / monthly) * 100)) : 0;

  const submit = (input: BudgetInput) => save.mutate(input, {
    onSuccess: () => Alert.alert('Đã cập nhật AI Budget'),
    onError: (error) => presentError('Không thể lưu', error),
  });

  return (
    <Screen title="AI Budget" subtitle="Workspace AI cost governance">
      <Card>
        <View style={styles.row}>
          <View><Muted>Đã dùng</Muted><Text style={styles.big}>${usage.toFixed(2)}</Text></View>
          <View><Muted>Giới hạn</Muted><Text style={styles.big}>${monthly.toFixed(2)}</Text></View>
        </View>
        <View style={styles.track}><View style={[styles.progress, { width: `${pct}%` }]} /></View>
        <Muted>{pct}% ngân sách tháng</Muted>
      </Card>
      {budget.data ? (
        <BudgetForm
          key={`${orgId ?? 'none'}-${budget.dataUpdatedAt}`}
          initial={budget.data}
          saving={save.isPending}
          onSubmit={submit}
        />
      ) : <Muted>Chưa có cấu hình AI Budget.</Muted>}
    </Screen>
  );
}

function BudgetForm({ initial, saving, onSubmit }: { initial: AiBudget; saving: boolean; onSubmit: (input: BudgetInput) => void }) {
  const [limit, setLimit] = useState(String(initial.monthlyUsdLimit));
  const [threshold, setThreshold] = useState(String(initial.alertThresholdPct));
  const [resetDay, setResetDay] = useState(String(initial.resetDay));
  const parsedLimit = Number(limit);

  return (
    <Card>
      <Label>Monthly limit (USD)</Label>
      <Field keyboardType="decimal-pad" value={limit} onChangeText={setLimit} />
      <Label>Alert threshold (%)</Label>
      <Field keyboardType="number-pad" value={threshold} onChangeText={setThreshold} />
      <Label>Reset day</Label>
      <Field keyboardType="number-pad" value={resetDay} onChangeText={setResetDay} />
      <Button
        title={saving ? 'Đang lưu...' : 'Lưu budget'}
        disabled={saving || !Number.isFinite(parsedLimit)}
        onPress={() => onSubmit({ monthlyUsdLimit: parsedLimit, alertThresholdPct: Number(threshold), resetDay: Number(resetDay) })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  big: { color: '#f5f7fa', fontSize: 24, fontWeight: '900' },
  track: { height: 8, borderRadius: 999, backgroundColor: '#25313d', overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: '#2388ff' },
});
