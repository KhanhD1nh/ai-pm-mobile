import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Field } from '@/shared/components/ui/primitives';
import { ListGroup, ListRow, SectionHeader } from '@/shared/components/ui/mobile';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { useAuth } from '@/providers/auth-provider';
import type { AiBudget } from '@/shared/contracts';
import { useAiBudget } from '../queries/use-organization-admin';
import { useUpdateAiBudget } from '../mutations/use-organization-mutations';

type BudgetInput = Pick<AiBudget, 'monthlyUsdLimit' | 'alertThresholdPct' | 'resetDay'>;

export default function AiBudgetScreen() {
  const { orgId } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const budget = useAiBudget(orgId);
  const save = useUpdateAiBudget(orgId);
  if (budget.isLoading) return <LoadingScreen chrome="stack" title="AI Budget" subtitle={language === 'vi' ? 'Kiểm soát chi phí AI của workspace' : 'Workspace AI cost governance'} />;

  const usage = budget.data?.currentUsageUsd ?? 0;
  const monthly = budget.data?.monthlyUsdLimit ?? 0;
  const pct = monthly > 0 ? Math.min(100, Math.round((usage / monthly) * 100)) : 0;
  const submit = (input: BudgetInput) => save.mutate(input, { onSuccess: () => Alert.alert(language === 'vi' ? 'Đã cập nhật AI Budget' : 'AI Budget updated'), onError: (error) => presentError(language === 'vi' ? 'Không thể lưu' : 'Could not save', error) });

  return (
    <Screen chrome="stack" title="AI Budget" subtitle={language === 'vi' ? 'Kiểm soát chi phí AI của workspace' : 'Workspace AI cost governance'}>
      <View style={{ gap: 14, padding: 18, borderRadius: ui.radius.xl, backgroundColor: ui.colors.surface, borderWidth: 1, borderColor: ui.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View><Text style={{ color: ui.colors.textMuted, ...ui.typography.caption }}>{language === 'vi' ? 'Đã dùng tháng này' : 'Used this month'}</Text><Text style={{ color: ui.colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.9 }}>${usage.toFixed(2)}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ color: ui.colors.textMuted, ...ui.typography.caption }}>{language === 'vi' ? 'Giới hạn' : 'Limit'}</Text><Text style={{ color: ui.colors.textSecondary, fontSize: 18, fontWeight: '700' }}>${monthly.toFixed(2)}</Text></View>
        </View>
        <View style={{ height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: ui.colors.surfaceRaised }}><View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: pct >= (budget.data?.alertThresholdPct ?? 80) ? ui.colors.warning : ui.colors.accent }} /></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Ionicons accessible={false} name={pct >= (budget.data?.alertThresholdPct ?? 80) ? 'warning-outline' : 'checkmark-circle-outline'} size={16} color={pct >= (budget.data?.alertThresholdPct ?? 80) ? ui.colors.warning : ui.colors.success} /><Text style={{ color: ui.colors.textSecondary, ...ui.typography.body }}>{pct}% {language === 'vi' ? 'ngân sách tháng đã sử dụng' : 'of monthly budget used'}</Text></View>
      </View>

      {budget.data ? <BudgetForm key={`${orgId ?? 'none'}-${budget.dataUpdatedAt}`} initial={budget.data} saving={save.isPending} onSubmit={submit} language={language} /> : <Text style={{ color: ui.colors.textMuted }}>{language === 'vi' ? 'Chưa có cấu hình AI Budget.' : 'No AI Budget configured.'}</Text>}

      <SectionHeader title={language === 'vi' ? 'Cách hoạt động' : 'How it works'} />
      <ListGroup>
        <ListRow first icon="notifications-outline" label={language === 'vi' ? 'Ngưỡng cảnh báo' : 'Alert threshold'} value={`${budget.data?.alertThresholdPct ?? 80}%`} detail={language === 'vi' ? 'Cảnh báo khi usage chạm ngưỡng này.' : 'Warn when usage reaches this level.'} />
        <ListRow icon="refresh-outline" label={language === 'vi' ? 'Ngày reset' : 'Reset day'} value={`${budget.data?.resetDay ?? 1}`} detail={language === 'vi' ? 'Ngày bắt đầu chu kỳ ngân sách mới.' : 'Day the monthly budget cycle restarts.'} />
      </ListGroup>
    </Screen>
  );
}

function BudgetForm({ initial, saving, onSubmit, language }: { initial: AiBudget; saving: boolean; onSubmit: (input: BudgetInput) => void; language: 'vi' | 'en' }) {
  const [limit, setLimit] = useState(String(initial.monthlyUsdLimit));
  const [threshold, setThreshold] = useState(String(initial.alertThresholdPct));
  const [resetDay, setResetDay] = useState(String(initial.resetDay));
  const parsedLimit = Number(limit);
  return <>
    <SectionHeader title={language === 'vi' ? 'Thiết lập ngân sách' : 'Budget settings'} />
    <View style={{ gap: 10 }}>
      <Field keyboardType="decimal-pad" placeholder={language === 'vi' ? 'Giới hạn tháng (USD)' : 'Monthly limit (USD)'} value={limit} onChangeText={setLimit} />
      <Field keyboardType="number-pad" placeholder={language === 'vi' ? 'Ngưỡng cảnh báo (%)' : 'Alert threshold (%)'} value={threshold} onChangeText={setThreshold} />
      <Field keyboardType="number-pad" placeholder={language === 'vi' ? 'Ngày reset' : 'Reset day'} value={resetDay} onChangeText={setResetDay} />
      <Button title={saving ? (language === 'vi' ? 'Đang lưu…' : 'Saving…') : (language === 'vi' ? 'Lưu ngân sách' : 'Save budget')} disabled={saving || !Number.isFinite(parsedLimit)} onPress={() => onSubmit({ monthlyUsdLimit: parsedLimit, alertThresholdPct: Number(threshold), resetDay: Number(resetDay) })} />
    </View>
  </>;
}

