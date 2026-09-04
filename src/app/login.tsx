import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, Muted } from '@/components/ui/primitives';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/services/api';

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [initialSetup, setInitialSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { void authApi.setupStatus().then((x) => setInitialSetup(x.initialSetupRequired)).catch(() => {}); }, []);

  const submit = async () => {
    if (!email.trim() || !password || (initialSetup && !name.trim())) return;
    setLoading(true);
    try {
      if (initialSetup) await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert(initialSetup ? 'Khởi tạo thất bại' : 'Đăng nhập thất bại', error instanceof Error ? error.message : 'Không thể tiếp tục');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.logo}><Text style={styles.logoText}>AI</Text></View>
        <Text style={styles.title}>AI-PM</Text>
        <Muted>{initialSetup ? 'Khởi tạo System Owner đầu tiên.' : 'Quản lý dự án, công việc và AI agents trên mobile.'}</Muted>
        <View style={styles.form}>
          {initialSetup ? <Field placeholder="Tên của bạn" value={name} onChangeText={setName} /> : null}
          <Field autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
          <Field secureTextEntry placeholder="Mật khẩu" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
          <Button title={loading ? 'Đang xử lý...' : initialSetup ? 'Khởi tạo AI-PM' : 'Đăng nhập'} disabled={loading || !email.trim() || !password || (initialSetup && !name.trim())} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 10 },
  logo: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#2388ff', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoText: { color: 'white', fontWeight: '900', fontSize: 22 },
  title: { color: '#f5f7fa', fontSize: 34, fontWeight: '900' },
  form: { gap: 12, marginTop: 24 },
});
