import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/auth-provider';
import { authenticateForAppUnlock, isBiometricLockEnabled, subscribeBiometricLock } from '@/infrastructure/security/biometric-service';

export function AppLockBootstrap() {
  const { user } = useAuth();
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
      <Text style={styles.title}>AI-PM đang khóa</Text>
      <Text style={styles.body}>Xác thực sinh trắc học để tiếp tục.</Text>
      <Pressable style={styles.button} onPress={() => void unlock()}><Text style={styles.buttonText}>Mở khóa</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, elevation: 9999, backgroundColor: '#0b0f14', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2388ff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { color: '#fff', fontSize: 23, fontWeight: '900' },
  body: { color: '#8794a2', textAlign: 'center' },
  button: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 13, backgroundColor: '#2388ff', borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '900' },
});
