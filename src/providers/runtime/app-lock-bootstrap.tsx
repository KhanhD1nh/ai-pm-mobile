import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/auth-provider';
import { authenticateForAppUnlock, isBiometricLockEnabled, subscribeBiometricLock } from '@/infrastructure/security/biometric-service';
import { useAppPreferences } from '@/shared/preferences/app-preferences-context';
import type { AppTheme } from '@/shared/components/ui/theme';

export function AppLockBootstrap() {
  const { user } = useAuth();
  const { theme: ui, language } = useAppPreferences();
  const styles = useMemo(() => StyleSheet.create(createStyles(ui)), [ui]);
  const userId = user?.id ?? null;
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const authenticating = useRef(false);

  const unlock = useCallback(async () => {
    if (!enabled || !userId || authenticating.current) return;
    authenticating.current = true;
    setLocked(true);
    try {
      const ok = await authenticateForAppUnlock();
      if (ok) setLocked(false);
    } finally {
      authenticating.current = false;
    }
  }, [enabled, userId]);

  useEffect(() => {
    void isBiometricLockEnabled().then(setEnabled);
    return subscribeBiometricLock((value) => {
      setEnabled(value);
      if (!value) setLocked(false);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;
    void unlock();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void unlock();
      else if (state === 'background' || state === 'inactive') setLocked(true);
    });
    return () => sub.remove();
  }, [enabled, userId, unlock]);

  if (!enabled || !userId || !locked) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.logo}><Text style={styles.logoText}>AI</Text></View>
      <Text style={styles.title}>{language === 'vi' ? 'AI-PM đang khóa' : 'AI-PM is locked'}</Text>
      <Text style={styles.body}>{language === 'vi' ? 'Xác thực sinh trắc học để tiếp tục.' : 'Authenticate with biometrics to continue.'}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => void unlock()}>
        <Text style={styles.buttonText}>{language === 'vi' ? 'Mở khóa' : 'Unlock'}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (ui: AppTheme) => ({
  overlay: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, elevation: 9999, backgroundColor: ui.colors.bg, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 12, padding: 24 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: ui.colors.accentSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  logoText: { color: ui.colors.accentStrong, fontSize: 24, fontWeight: '800' as const },
  title: { color: ui.colors.text, ...ui.typography.title },
  body: { color: ui.colors.textMuted, ...ui.typography.body, textAlign: 'center' as const },
  button: { minHeight: 48, marginTop: 10, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: ui.colors.accentStrong, borderRadius: ui.radius.md, alignItems: 'center' as const, justifyContent: 'center' as const },
  buttonText: { color: ui.colors.inverseText, ...ui.typography.bodyStrong },
});
