import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, type PropsWithChildren, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import type { AppTheme } from './theme';
import { MotionPressable } from './motion';
import { LiquidGlassSurface } from './glass';
import { Field } from './primitives';

export function SectionHeader({ title, caption, right }: { title: string; caption?: string; right?: ReactNode }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function GlassIconButton({ icon, label, onPress, selected = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <MotionPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} hitSlop={4} onPress={onPress} style={styles.glassIconHit}>
      <LiquidGlassSurface preset="compactControl" interactive style={styles.glassIconButton} fallbackStyle={styles.glassIconFallback}>
        <Ionicons accessible={false} name={icon} size={20} color={selected ? ui.colors.accentStrong : ui.colors.text} />
      </LiquidGlassSurface>
    </MotionPressable>
  );
}

export function SearchBar({ containerStyle, ...props }: TextInputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <View style={[styles.searchBar, containerStyle]}>
      <Ionicons accessible={false} name="search-outline" size={18} color={ui.colors.textMuted} />
      <Field {...props} style={[styles.searchBarField, props.style]} />
      {typeof props.value === 'string' && props.value.length > 0 && props.onChangeText ? (
        <MotionPressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => props.onChangeText?.('')} style={styles.searchClear}>
          <Ionicons accessible={false} name="close-circle" size={18} color={ui.colors.textMuted} />
        </MotionPressable>
      ) : null}
    </View>
  );
}

export function SegmentedControl({ items, value, onChange }: { items: { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap }[]; value: string; onChange: (key: string) => void }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);

  return (
    <View style={styles.segmented}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <MotionPressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {item.icon ? <Ionicons accessible={false} name={item.icon} size={15} color={active ? ui.colors.text : ui.colors.textSecondary} /> : null}
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

export function ContentTabs({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (key: string) => void }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);

  return (
    <View style={styles.contentTabs} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <MotionPressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={styles.contentTab}
          >
            <Text style={[styles.contentTabText, active && styles.contentTabTextActive]}>{item.label}</Text>
            <View style={[styles.contentTabIndicator, active && styles.contentTabIndicatorActive]} />
          </MotionPressable>
        );
      })}
    </View>
  );
}

export function ListGroup({ children, style, variant = 'grouped' }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; variant?: 'grouped' | 'plain' }>) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return <View style={[styles.group, variant === 'plain' && styles.groupPlain, style]}>{children}</View>;
}

export function ListRow({ icon, label, value, detail, onPress, trailing, danger = false, first = false }: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  detail?: string | null;
  onPress?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
  first?: boolean;
}) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const content = (
    <>
      {icon ? <View accessible={false} style={[styles.rowIcon, danger && styles.rowIconDanger]}><Ionicons accessible={false} name={icon} size={18} color={danger ? ui.colors.danger : ui.colors.accentStrong} /></View> : null}
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail} numberOfLines={2}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      {trailing ?? (onPress ? <Ionicons accessible={false} name="chevron-forward" size={16} color={ui.colors.textMuted} /> : null)}
    </>
  );
  if (!onPress) return <View style={[styles.row, !first && styles.rowBorder]}>{content}</View>;
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={[label, detail, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={[styles.row, !first && styles.rowBorder]}
    >
      {content}
    </MotionPressable>
  );
}

export function BottomSheet({ visible, title, subtitle, onClose, children, footer }: PropsWithChildren<{ visible: boolean; title: string; subtitle?: string; onClose: () => void; footer?: ReactNode }>) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.backdrop}>
        <LiquidGlassSurface
          preset="frosted"
          accessibilityMode="auto"
          pointerEvents="none"
          rim={false}
          specular={false}
          thickness={0}
          blurRadius={22}
          dim={0.28}
          style={StyleSheet.absoluteFill}
          fallbackStyle={{ backgroundColor: ui.colors.overlay }}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={Platform.OS === 'android'
            ? SlideInDown.springify().damping(20).stiffness(220).mass(0.8)
            : SlideInDown.duration(240).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(180).easing(Easing.in(Easing.cubic))}
          style={styles.sheetFrame}
        >
          <View style={[styles.sheet, Platform.OS === 'android' && styles.sheetAndroid]}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleCopy}>
                <Text style={styles.sheetTitle}>{title}</Text>
                {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
              </View>
              <MotionPressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose} style={styles.closeButton}><Ionicons accessible={false} name="close" size={19} color={ui.colors.textSecondary} /></MotionPressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>{children}</ScrollView>
            {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function ChoiceRow({ label, active, onPress, description }: { label: string; active?: boolean; onPress: () => void; description?: string }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <MotionPressable accessibilityRole="button" accessibilityLabel={[label, description].filter(Boolean).join(', ')} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>{label}</Text>
        {description ? <Text style={styles.choiceDescription}>{description}</Text> : null}
      </View>
      <View accessible={false} style={[styles.radio, active && styles.radioActive]}>{active ? <Ionicons accessible={false} name="checkmark" size={13} color="#FFFFFF" /> : null}</View>
    </MotionPressable>
  );
}

export function FloatingActionButton({ icon = 'add', label, onPress }: { icon?: keyof typeof Ionicons.glyphMap; label?: string; onPress: () => void }) {
  const { theme: ui } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  return (
    <MotionPressable onPress={onPress} style={[styles.fabHost, label && styles.fabHostWide]}>
      <LiquidGlassSurface
        preset="compactControl"
        interactive
        accessibilityMode="auto"
        tintColor={ui.colors.accentSoft}
        style={[styles.fab, Platform.OS === 'android' && styles.fabAndroid, label && styles.fabWide, Platform.OS === 'android' && label && styles.fabWideAndroid]}
        fallbackStyle={styles.fabFallback}
      >
        <Ionicons accessible={false} name={icon} size={Platform.OS === 'android' ? 25 : 23} color={ui.colors.accentStrong} />
        {label ? <Text style={styles.fabLabel}>{label}</Text> : null}
      </LiquidGlassSurface>
    </MotionPressable>
  );
}

const createStyles = (ui: AppTheme) => StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 1, marginTop: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: ui.colors.text, ...ui.typography.heading, fontSize: 18 },
  sectionCaption: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  glassIconHit: { width: 44, height: 44, borderRadius: 15 },
  glassIconButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glassIconFallback: { backgroundColor: ui.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.border },
  searchBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 13, paddingRight: 8, borderRadius: 13, backgroundColor: ui.colors.surfaceRaised },
  searchBarField: { flex: 1, minHeight: 46, height: 46, borderWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
  searchClear: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', alignSelf: 'stretch', gap: 3, padding: 3, borderRadius: 14, backgroundColor: ui.colors.surfaceRaised },
  segment: { flex: 1, minHeight: 38, borderRadius: 11, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  segmentActive: { backgroundColor: ui.colors.bgElevated, ...ui.shadow.card },
  segmentText: { color: ui.colors.textSecondary, ...ui.typography.caption, fontWeight: '500' },
  segmentTextActive: { color: ui.colors.text, fontWeight: '600' },
  contentTabs: { minHeight: 46, flexDirection: 'row', alignItems: 'stretch', gap: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.colors.border },
  contentTab: { minWidth: 56, minHeight: 46, justifyContent: 'center', position: 'relative' },
  contentTabText: { color: ui.colors.textMuted, ...ui.typography.bodyStrong, fontSize: 14.5, fontWeight: '500' },
  contentTabTextActive: { color: ui.colors.text, fontWeight: '600' },
  contentTabIndicator: { position: 'absolute', left: 0, right: 0, bottom: -StyleSheet.hairlineWidth, height: 2, borderRadius: 1, backgroundColor: 'transparent' },
  contentTabIndicatorActive: { backgroundColor: ui.colors.accentStrong },
  group: { overflow: 'hidden', borderRadius: ui.radius.lg, backgroundColor: ui.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.border },
  groupPlain: { borderRadius: 0, backgroundColor: 'transparent', borderWidth: 0 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.accentSoft },
  rowIconDanger: { backgroundColor: ui.colors.dangerSoft },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { color: ui.colors.text, ...ui.typography.bodyStrong },
  rowLabelDanger: { color: ui.colors.danger },
  rowDetail: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  rowValue: { maxWidth: '42%', color: ui.colors.textSecondary, ...ui.typography.body, textAlign: 'right' },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheetFrame: { maxHeight: '88%', width: '100%' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 12, backgroundColor: ui.colors.bgElevated, borderTopWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.borderStrong, ...ui.shadow.floating },
  sheetAndroid: { borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 18 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: ui.colors.borderStrong, alignSelf: 'center', marginTop: 9 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  sheetTitleCopy: { flex: 1, minWidth: 0 },
  sheetTitle: { color: ui.colors.text, ...ui.typography.title },
  sheetSubtitle: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 3 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.colors.surfaceRaised },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 18, gap: 10 },
  sheetFooter: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.colors.border },
  choice: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: ui.radius.md, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: ui.colors.surface },
  choiceActive: { backgroundColor: ui.colors.accentSoft },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceLabel: { color: ui.colors.text, ...ui.typography.bodyStrong },
  choiceLabelActive: { color: ui.colors.accentStrong },
  choiceDescription: { color: ui.colors.textMuted, ...ui.typography.caption, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: ui.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ui.colors.accentStrong, backgroundColor: ui.colors.accentStrong },
  fabHost: { position: 'absolute', right: 18, bottom: 92, borderRadius: 20, ...ui.shadow.floating },
  fabHostWide: { borderRadius: 22 },
  fab: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fabFallback: { backgroundColor: ui.colors.bgElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: ui.colors.borderStrong },
  fabWide: { width: 'auto', minWidth: 112, paddingHorizontal: 17, flexDirection: 'row', gap: 8 },
  fabLabel: { color: ui.colors.accentStrong, ...ui.typography.bodyStrong, fontWeight: '800' },
  fabAndroid: { width: 64, height: 64, borderRadius: 20, elevation: 0, shadowOpacity: 0 },
  fabWideAndroid: { width: 'auto', minWidth: 126, paddingHorizontal: 20 },
});

