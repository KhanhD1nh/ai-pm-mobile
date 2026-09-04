import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export function SectionTitle({ children }: PropsWithChildren) { return <Text style={styles.section}>{children}</Text>; }
export function Label({ children }: PropsWithChildren) { return <Text style={styles.label}>{children}</Text>; }
export function Muted({ children }: PropsWithChildren) { return <Text style={styles.muted}>{children}</Text>; }
export function Pill({ text }: { text: string }) { return <View style={styles.pill}><Text style={styles.pillText}>{text}</Text></View>; }
export function Field(props: TextInputProps) { return <TextInput placeholderTextColor="#65727f" {...props} style={[styles.field, props.multiline && styles.multiline, props.style]} />; }
export function Button({ title, onPress, disabled, kind = 'primary' }: { title: string; onPress?: () => void; disabled?: boolean; kind?: 'primary' | 'secondary' | 'danger' }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, kind === 'secondary' && styles.secondary, kind === 'danger' && styles.danger, (pressed || disabled) && { opacity: 0.65 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#202a35', backgroundColor: '#111820', borderRadius: 16, padding: 14, gap: 9 },
  section: { color: '#f3f6f9', fontSize: 17, fontWeight: '800', marginTop: 5 },
  label: { color: '#aab5c0', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { color: '#8794a2', fontSize: 13 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: '#1b2632' },
  pillText: { color: '#c8d2dc', fontSize: 11, fontWeight: '700' },
  field: { minHeight: 46, borderWidth: 1, borderColor: '#2b3744', borderRadius: 12, paddingHorizontal: 12, color: '#f5f7fa', backgroundColor: '#10171f' },
  multiline: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  button: { minHeight: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#2388ff' },
  secondary: { backgroundColor: '#26313d' },
  danger: { backgroundColor: '#b83b46' },
  buttonText: { color: 'white', fontWeight: '800' },
});
