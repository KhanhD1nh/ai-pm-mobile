import Ionicons from '@react-native-vector-icons/ionicons';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field } from '@/shared/components/ui/primitives';
import { BottomSheet, ChoiceRow, SearchBar } from '@/shared/components/ui/mobile';
import { MotionPressable } from '@/shared/components/ui/motion';
import { EmptyState, LoadingScreen, Screen } from '@/shared/components/ui/screen';
import { priorityColor, statusCategoryColor, type AppTheme } from '@/shared/components/ui/theme';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import { presentError } from '@/shared/errors/present-error';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { usePullToRefresh } from '@/shared/hooks/use-pull-to-refresh';
import type { Priority } from '@/shared/contracts';
import { useBoardData } from '../queries/use-board-data';
import { useCreateIssue } from '../mutations/use-board-mutations';

const priorities: (Priority | 'ALL')[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function BoardScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [createStatusId, setCreateStatusId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [createAssignee, setCreateAssignee] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  const boardFilters = useMemo(() => ({
    priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    assigneeId: assigneeFilter !== 'ALL' && assigneeFilter !== 'UNASSIGNED' ? assigneeFilter : undefined,
    unassigned: assigneeFilter === 'UNASSIGNED' || undefined,
    cycleId: cycleFilter === 'ALL' ? undefined : cycleFilter === 'NONE' ? 'none' : cycleFilter,
    q: debouncedSearch || undefined,
  }), [assigneeFilter, cycleFilter, debouncedSearch, priorityFilter]);
  const { project, statuses, members, cycles, issues, issueItems, refresh } = useBoardData(projectId, boardFilters);
  const create = useCreateIssue(projectId);
  const pullRefresh = usePullToRefresh(refresh);

  const orderedStatuses = useMemo(() => [...(statuses.data ?? [])].sort((a, b) => a.position - b.position), [statuses.data]);

  const activeFilterCount = Number(priorityFilter !== 'ALL') + Number(assigneeFilter !== 'ALL') + Number(cycleFilter !== 'ALL');
  const hasNarrowing = activeFilterCount > 0 || search.trim().length > 0;
  const sections = useMemo(() => {
    const grouped = new Map(orderedStatuses.map((status) => [status.id, [] as typeof issueItems]));
    for (const issue of issueItems) grouped.get(issue.status_id)?.push(issue);
    return orderedStatuses
      .map((status) => ({ status, data: grouped.get(status.id) ?? [] }))
      .filter((section) => !hasNarrowing || section.data.length > 0);
  }, [hasNarrowing, issueItems, orderedStatuses]);

  const openCreateFor = (statusId?: string) => {
    setCreateStatusId(statusId || orderedStatuses[0]?.id || '');
    setOpenCreate(true);
  };

  const clearFilters = () => {
    setPriorityFilter('ALL');
    setAssigneeFilter('ALL');
    setCycleFilter('ALL');
  };

  const submitIssue = () => create.mutate(
    { title: title.trim(), description: description.trim() || undefined, priority, statusId: createStatusId || orderedStatuses[0]?.id, assigneeId: createAssignee || undefined },
    {
      onSuccess: () => {
        setOpenCreate(false);
        setTitle('');
        setDescription('');
        setCreateAssignee('');
        setPriority('MEDIUM');
      },
      onError: (error) => presentError(language === 'vi' ? 'Không thể tạo công việc' : 'Could not create task', error),
    },
  );

  if (project.isLoading) return <LoadingScreen />;

  return (
    <Screen edges={[]} scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={(issue) => issue.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshing={pullRefresh.refreshing}
        onRefresh={pullRefresh.onRefresh}
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (issues.hasNextPage && !issues.isFetchingNextPage) void issues.fetchNextPage();
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View style={styles.toolbar}>
            <SearchBar placeholder={language === 'vi' ? 'Tìm theo tên hoặc mã…' : 'Search title or identifier…'} value={search} onChangeText={setSearch} />
            <View style={styles.filterLine}>
              <MotionPressable accessibilityRole="button" accessibilityLabel={language === 'vi' ? 'Mở bộ lọc' : 'Open filters'} onPress={() => setShowFilters(true)} style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}>
                <Ionicons accessible={false} name="options-outline" size={17} color={activeFilterCount > 0 ? ui.colors.accentStrong : ui.colors.textSecondary} />
                <Text style={[styles.filterText, activeFilterCount > 0 && styles.filterTextActive]}>{language === 'vi' ? 'Bộ lọc' : 'Filters'}{activeFilterCount ? ` · ${activeFilterCount}` : ''}</Text>
              </MotionPressable>
              <Text style={styles.resultCount}>{issueItems.length}{issues.hasNextPage ? '+' : ''} {language === 'vi' ? 'công việc' : 'tasks'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={hasNarrowing ? (
          <View style={styles.filterEmpty}>
            <EmptyState title={language === 'vi' ? 'Không có công việc phù hợp' : 'No matching tasks'} body={language === 'vi' ? 'Thử đổi từ khóa hoặc xóa bộ lọc.' : 'Try another search or clear the filters.'} />
            {activeFilterCount > 0 ? <Button kind="secondary" title={language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'} onPress={clearFilters} /> : null}
          </View>
        ) : <EmptyState title={language === 'vi' ? 'Chưa có công việc' : 'No tasks yet'} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.statusHeader}>
            <View style={styles.statusHeading}>
              <View style={[styles.statusDot, { backgroundColor: statusCategoryColor(ui, section.status.category) }]} />
              <Text style={styles.statusTitle}>{section.status.name}</Text>
              <Text style={styles.statusCount}>{section.data.length}</Text>
            </View>
            <MotionPressable accessibilityRole="button" accessibilityLabel={`${language === 'vi' ? 'Thêm công việc vào' : 'Add task to'} ${section.status.name}`} onPress={() => openCreateFor(section.status.id)} style={styles.addInline}>
              <Ionicons accessible={false} name="add" size={20} color={ui.colors.textSecondary} />
            </MotionPressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item: issue }) => (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`${issue.identifier}, ${issue.title}, ${issue.priority}`}
            onPress={() => router.push({ pathname: '/issue/[identifier]', params: { identifier: issue.identifier } })}
            style={styles.issueRow}
          >
            <View style={styles.issueCircle} />
            <View style={styles.issueCopy}>
              <Text style={styles.issueTitle} numberOfLines={2}>{issue.title}</Text>
              <View style={styles.metaLine}>
                <Text style={styles.identifier}>{issue.identifier}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={[styles.metaText, { color: priorityColor(ui, issue.priority) }]}>{issue.priority}</Text>
                {issue.due_date ? <><Text style={styles.metaDot}>·</Text><Text style={styles.metaText}>{new Date(issue.due_date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</Text></> : null}
              </View>
            </View>
            {issue.assignee?.name ? <View style={styles.assignee}><Text style={styles.assigneeText}>{issue.assignee.name.charAt(0).toUpperCase()}</Text></View> : null}
          </MotionPressable>
        )}
        ListFooterComponent={issues.isFetchingNextPage ? <Text style={styles.loadingMore}>{language === 'vi' ? 'Đang tải thêm…' : 'Loading more…'}</Text> : null}
      />

      <BottomSheet visible={showFilters} title={language === 'vi' ? 'Bộ lọc' : 'Filters'} subtitle={language === 'vi' ? 'Chỉ giữ lại công việc bạn cần lúc này' : 'Keep only the work you need right now'} onClose={() => setShowFilters(false)} footer={<Button kind="secondary" title={language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'} onPress={clearFilters} />}>
        <Text style={styles.sheetLabel}>{language === 'vi' ? 'Ưu tiên' : 'Priority'}</Text>
        {priorities.map((item) => <ChoiceRow key={item} label={item === 'ALL' ? (language === 'vi' ? 'Tất cả' : 'All') : item} active={priorityFilter === item} onPress={() => setPriorityFilter(item)} />)}
        <Text style={styles.sheetLabel}>Assignee</Text>
        <ChoiceRow label={language === 'vi' ? 'Tất cả' : 'All'} active={assigneeFilter === 'ALL'} onPress={() => setAssigneeFilter('ALL')} />
        <ChoiceRow label={language === 'vi' ? 'Chưa giao' : 'Unassigned'} active={assigneeFilter === 'UNASSIGNED'} onPress={() => setAssigneeFilter('UNASSIGNED')} />
        {(members.data ?? []).map((member) => <ChoiceRow key={member.id} label={member.name} active={assigneeFilter === member.id} onPress={() => setAssigneeFilter(member.id)} />)}
        <Text style={styles.sheetLabel}>Cycle</Text>
        <ChoiceRow label={language === 'vi' ? 'Tất cả' : 'All'} active={cycleFilter === 'ALL'} onPress={() => setCycleFilter('ALL')} />
        <ChoiceRow label={language === 'vi' ? 'Không có cycle' : 'No cycle'} active={cycleFilter === 'NONE'} onPress={() => setCycleFilter('NONE')} />
        {(cycles.data ?? []).map((cycle) => <ChoiceRow key={cycle.id} label={cycle.name || `Cycle ${cycle.number}`} active={cycleFilter === cycle.id} onPress={() => setCycleFilter(cycle.id)} />)}
      </BottomSheet>

      <BottomSheet visible={openCreate} title={language === 'vi' ? 'Tạo công việc' : 'Create task'} subtitle={orderedStatuses.find((status) => status.id === createStatusId)?.name ?? project.data?.name} onClose={() => setOpenCreate(false)} footer={<Button title={create.isPending ? (language === 'vi' ? 'Đang tạo…' : 'Creating…') : (language === 'vi' ? 'Tạo công việc' : 'Create task')} disabled={!title.trim() || create.isPending} onPress={submitIssue} />}>
        <Field placeholder={language === 'vi' ? 'Tiêu đề công việc' : 'Task title'} value={title} onChangeText={setTitle} autoFocus />
        <Field placeholder={language === 'vi' ? 'Mô tả (không bắt buộc)' : 'Description (optional)'} multiline value={description} onChangeText={setDescription} />
        <Text style={styles.sheetLabel}>{language === 'vi' ? 'Ưu tiên' : 'Priority'}</Text>
        {priorities.filter((item) => item !== 'ALL').map((item) => <ChoiceRow key={item} label={item} active={priority === item} onPress={() => setPriority(item as Priority)} />)}
        <Text style={styles.sheetLabel}>Assignee</Text>
        <ChoiceRow label={language === 'vi' ? 'Chưa giao' : 'Unassigned'} active={!createAssignee} onPress={() => setCreateAssignee('')} />
        {(members.data ?? []).map((member) => <ChoiceRow key={member.id} label={member.name} active={createAssignee === member.id} onPress={() => setCreateAssignee(member.id)} />)}
      </BottomSheet>
    </Screen>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  listContent: { paddingBottom: 24 },
  toolbar: { gap: 9, paddingTop: 2 },
  filterLine: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  filterButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2 },
  filterButtonActive: { paddingHorizontal: 10, borderRadius: 12, backgroundColor: ui.colors.accentSoft },
  filterText: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '600' },
  filterTextActive: { color: ui.colors.accentStrong },
  resultCount: { color: ui.colors.textMuted, ...ui.typography.caption },
  statusHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 4, backgroundColor: ui.colors.bg },
  statusHeading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTitle: { color: ui.colors.text, ...ui.typography.heading, fontSize: 16 },
  statusCount: { color: ui.colors.textMuted, ...ui.typography.caption },
  addInline: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  issueRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.colors.border },
  issueCircle: { width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: ui.colors.borderStrong },
  issueCopy: { flex: 1, minWidth: 0 },
  issueTitle: { color: ui.colors.text, fontSize: 15.5, lineHeight: 21, fontWeight: '500' },
  metaLine: { minHeight: 18, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 3 },
  identifier: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '600' },
  metaText: { color: ui.colors.textMuted, ...ui.typography.caption },
  metaDot: { color: ui.colors.textMuted, fontSize: 12 },
  assignee: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  assigneeText: { color: ui.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  filterEmpty: { gap: 4, paddingBottom: 8 },
  sheetLabel: { color: ui.colors.textMuted, ...ui.typography.eyebrow, marginTop: 8, marginBottom: 2 },
  loadingMore: { color: ui.colors.textMuted, ...ui.typography.caption, textAlign: 'center', paddingVertical: 18 },
});
