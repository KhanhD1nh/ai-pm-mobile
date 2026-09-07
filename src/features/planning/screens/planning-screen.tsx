import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field, Pill } from '@/shared/components/ui/primitives';
import { BottomSheet, SectionHeader } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import { LoadingScreen, Screen } from '@/shared/components/ui/screen';
import type { AppTheme } from '@/shared/components/ui/theme';
import { usePullToRefresh } from '@/shared/hooks/use-pull-to-refresh';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { usePlanning } from '../queries/use-planning';
import { useCreateCycle, useCreateMilestone } from '../mutations/use-planning-mutations';

type CreateMode = 'cycle' | 'milestone' | null;

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export default function PlanningScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const { project, cycles, milestones, scheduled, refresh } = usePlanning(projectId);
  const pullRefresh = usePullToRefresh(refresh);
  const createCycle = useCreateCycle(projectId);
  const createMilestone = useCreateMilestone(projectId);
  const [mode, setMode] = useState<CreateMode>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selectedOffset, setSelectedOffset] = useState(0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  }), [today]);
  const selectedDate = days[selectedOffset] ?? today;
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  const scheduledForDay = useMemo(() => scheduled
    .filter((issue) => issue.scheduled_start && startOfDay(new Date(issue.scheduled_start)).getTime() === selectedDate.getTime())
    .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()), [scheduled, selectedDate]);

  const reset = () => { setName(''); setStart(''); setEnd(''); };
  const submit = () => {
    const onSuccess = () => { setMode(null); reset(); };
    const onError = (error: unknown) => presentError(language === 'vi' ? 'Không thể lưu' : 'Could not save', error);
    if (mode === 'cycle') { createCycle.mutate({ name: name.trim(), startsAt: start, endsAt: end }, { onSuccess, onError }); return; }
    createMilestone.mutate({ title: name.trim(), startDate: start || undefined, targetDate: end }, { onSuccess, onError });
  };

  if (project.isLoading) return <LoadingScreen />;

  return (
    <Screen edges={[]} refreshing={pullRefresh.refreshing} onRefresh={pullRefresh.onRefresh}>
      <View style={styles.scheduleToolbar}>
        <View style={styles.monthLabel}><Text style={styles.monthText}>{selectedDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text></View>
        <MotionPressable accessibilityRole="button" onPress={() => setMode('cycle')} style={styles.addPlanButton}><Ionicons accessible={false} name="add" size={17} color={ui.colors.accentStrong} /><Text style={styles.addLink}>{language === 'vi' ? 'Kế hoạch' : 'Plan'}</Text></MotionPressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {days.map((date, index) => {
          const active = selectedOffset === index;
          const hasEvent = scheduled.some((issue) => issue.scheduled_start && startOfDay(new Date(issue.scheduled_start)).getTime() === date.getTime());
          return (
            <MotionPressable key={date.toISOString()} onPress={() => setSelectedOffset(index)} style={styles.dateItem}>
              <Text style={styles.weekday}>{date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')}</Text>
              <View style={[styles.dayCircle, active && styles.dayCircleActive]}><Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{date.getDate()}</Text></View>
              <View style={[styles.eventDot, hasEvent && styles.eventDotVisible]} />
            </MotionPressable>
          );
        })}
      </ScrollView>

      <View style={styles.timeline}>
        {scheduledForDay.length === 0 ? (
          <View style={styles.emptySchedule}>
            <Ionicons accessible={false} name="calendar-clear-outline" size={26} color={ui.colors.textMuted} />
            <Text style={styles.emptyTitle}>{language === 'vi' ? 'Chưa có lịch' : 'Nothing scheduled'}</Text>
            <Text style={styles.emptyBody}>{language === 'vi' ? 'Các focus session trong ngày sẽ xuất hiện tại đây.' : 'Focus sessions for the day will appear here.'}</Text>
          </View>
        ) : scheduledForDay.map((issue, index) => {
          const starts = new Date(issue.scheduled_start!);
          const ends = new Date(starts.getTime() + Number(issue.focus_hours ?? 1) * 60 * 60 * 1000);
          return (
            <View key={issue.id} style={styles.timelineRow}>
              <View style={styles.timeColumn}><Text style={styles.hour}>{starts.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</Text></View>
              <View style={styles.lineColumn}><View style={styles.timelineDot} />{index < scheduledForDay.length - 1 ? <View style={styles.timelineLine} /> : null}</View>
              <MotionPressable onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })} style={styles.eventCard}>
                <Pill text={`${starts.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${ends.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`} tone="accent" />
                <Text style={styles.eventTitle} numberOfLines={2}>{issue.title}</Text>
                <View style={styles.eventMeta}><Text style={styles.eventIdentifier}>{issue.identifier}</Text>{issue.focus_hours ? <Text style={styles.eventIdentifier}>{Number(issue.focus_hours)}h focus</Text> : null}</View>
              </MotionPressable>
            </View>
          );
        })}
      </View>

      <SectionHeader title={language === 'vi' ? 'Kế hoạch dự án' : 'Project planning'} caption={language === 'vi' ? 'Cycle và milestone' : 'Cycles and milestones'} />
      <View style={styles.planSummary}>
        <MotionPressable accessibilityRole="button" onPress={() => setMode('cycle')} style={[styles.planCard, styles.planCardDivider]}><Ionicons accessible={false} name="repeat-outline" size={20} color={ui.colors.accentStrong} /><Text style={styles.planValue}>{cycles.data?.length ?? 0}</Text><Text style={styles.planLabel}>Cycles</Text></MotionPressable>
        <MotionPressable accessibilityRole="button" onPress={() => setMode('milestone')} style={styles.planCard}><Ionicons accessible={false} name="flag-outline" size={20} color={ui.colors.warning} /><Text style={styles.planValue}>{milestones.data?.length ?? 0}</Text><Text style={styles.planLabel}>Milestones</Text></MotionPressable>
      </View>

      <BottomSheet visible={mode !== null} title={mode === 'cycle' ? (language === 'vi' ? 'Tạo cycle' : 'Create cycle') : (language === 'vi' ? 'Tạo milestone' : 'Create milestone')} onClose={() => setMode(null)} footer={<Button title={language === 'vi' ? 'Tạo' : 'Create'} disabled={!name.trim() || !end || (mode === 'cycle' && !start)} onPress={submit} />}>
        <Field placeholder={language === 'vi' ? 'Tên' : 'Name'} value={name} onChangeText={setName} autoFocus />
        <Field placeholder="Start: 2026-09-04" value={start} onChangeText={setStart} />
        <Field placeholder={mode === 'cycle' ? 'End: 2026-09-18' : 'Target: 2026-09-18'} value={end} onChangeText={setEnd} />
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  appBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surface },
  projectIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  projectAvatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.accentSoft },
  projectAvatarText: { color: ui.colors.accentStrong, fontSize: 12, fontWeight: '700' },
  projectName: { flex: 1, color: ui.colors.text, ...ui.typography.bodyStrong, fontSize: 15 },
  scheduleToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12 },
  monthLabel: { minHeight: 44, justifyContent: 'center' },
  monthText: { color: ui.colors.text, ...ui.typography.heading, textTransform: 'capitalize' },
  addPlanButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 14, backgroundColor: ui.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.border },
  addLink: { color: ui.colors.accentStrong, ...ui.typography.caption, fontWeight: '600' },
  dateStrip: { flexGrow: 1, justifyContent: 'space-between', gap: 6, paddingVertical: 2 },
  dateItem: { width: 44, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 6 },
  weekday: { color: ui.colors.textMuted, fontSize: 10.5, fontWeight: '600' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: ui.colors.text },
  dayNumber: { color: ui.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  dayNumberActive: { color: ui.colors.inverseText },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  eventDotVisible: { backgroundColor: ui.colors.accentStrong },
  timeline: { gap: 0, minHeight: 260 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 126 },
  timeColumn: { width: 54, paddingTop: 9 },
  hour: { color: ui.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  lineColumn: { width: 18, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, marginTop: 14, borderRadius: 4, backgroundColor: ui.colors.accentStrong, zIndex: 1 },
  timelineLine: { width: 1, flex: 1, backgroundColor: ui.colors.border, marginTop: 2 },
  eventCard: { flex: 1, marginBottom: 10, padding: 14, borderRadius: ui.radius.lg, backgroundColor: ui.colors.surface, ...ui.shadow.card },
  eventTitle: { color: ui.colors.text, ...ui.typography.bodyStrong, fontSize: 14.5, marginTop: 10 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eventIdentifier: { color: ui.colors.textMuted, ...ui.typography.caption, fontSize: 10.5 },
  emptySchedule: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 30 },
  emptyTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
  emptyBody: { color: ui.colors.textMuted, ...ui.typography.caption, textAlign: 'center', maxWidth: 270 },
  planSummary: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.border },
  planCard: { flex: 1, minHeight: 102, paddingVertical: 14, paddingHorizontal: 16 },
  planCardDivider: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: ui.colors.border },
  planValue: { color: ui.colors.text, fontSize: 24, lineHeight: 29, fontWeight: '600', marginTop: 10 },
  planLabel: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
});
