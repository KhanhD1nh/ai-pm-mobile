import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field } from "@/shared/components/ui/primitives";
import {
  FadeInView,
  MotionPressable,
  SoftFade,
} from "@/shared/components/ui/motion";
import type { AppTheme } from "@/shared/components/ui/theme";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import { useSetupStatus } from "../queries/use-setup-status";
import { useTelegramConfig } from "../public";
import { sessionStorage } from '@/infrastructure/auth/session-storage';

export default function LoginScreen() {
  const { login, signup, user, beginTelegramLogin, pollTelegramLogin } = useAuth();
  const {
    theme: ui,
    language,
    resolvedTheme,
    setThemePreference,
    setLanguage,
    t,
  } = useAppPreferences();
  const styles = useMemo(() => createStyles(ui), [ui]);
  const setupStatus = useSetupStatus();
  const telegramConfig = useTelegramConfig();
  const initialSetup = Boolean(setupStatus.data?.initialSetupRequired);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const telegramAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => telegramAbortRef.current?.abort(), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void sessionStorage.getPendingDestination().then(async (destination) => {
      if (cancelled) return;
      if (destination) await sessionStorage.clearPendingDestination();
      router.replace((destination || '/home') as never);
    });
    return () => { cancelled = true; };
  }, [user]);

  const submit = async () => {
    if (!email.trim() || !password || (initialSetup && !name.trim())) return;
    setLoading(true);
    try {
      if (initialSetup) await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (error) {
      presentError(
        initialSetup ? t("login.setupFailed") : t("login.signInFailed"),
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const telegramSignIn = async () => {
    telegramAbortRef.current?.abort();
    const controller = new AbortController();
    telegramAbortRef.current = controller;
    setTelegramLoading(true);
    try {
      const { nonce, deepLink, expiresIn } = await beginTelegramLogin();
      if (controller.signal.aborted) return;
      await Linking.openURL(deepLink);
      const deadline = Date.now() + expiresIn * 1000;
      while (!controller.signal.aborted && Date.now() < deadline) {
        const approved = await pollTelegramLogin(nonce, controller.signal);
        if (approved) return;
        await new Promise<void>((resolve) => setTimeout(resolve, AppState.currentState === 'active' ? 1800 : 3500));
      }
      if (controller.signal.aborted) return;
      presentError(t('login.signInFailed'), new Error(language === 'vi' ? 'Yêu cầu đăng nhập Telegram đã hết hạn.' : 'Telegram sign-in request expired.'));
    } catch (error) {
      if (controller.signal.aborted) return;
      presentError(t('login.signInFailed'), error);
    } finally {
      if (telegramAbortRef.current === controller) {
        telegramAbortRef.current = null;
        setTelegramLoading(false);
      }
    }
  };

  const toggleTheme = () =>
    void setThemePreference(resolvedTheme === "dark" ? "light" : "dark");
  const toggleLanguage = () =>
    void setLanguage(language === "vi" ? "en" : "vi");

  return (
    <SafeAreaView style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.dismissArea}>
          <SoftFade style={styles.utilityBar}>
            <View style={styles.wordmark}>
              <View style={styles.mark}>
                <Text style={styles.markText}>AI</Text>
              </View>
              <Text style={styles.wordmarkText}>AI-PM</Text>
            </View>
            <View style={styles.utilityActions}>
              <MotionPressable
                onPress={toggleLanguage}
                style={styles.utilityButton}
              >
                <Text style={styles.utilityText}>{language.toUpperCase()}</Text>
              </MotionPressable>
              <MotionPressable onPress={toggleTheme} style={styles.utilityButton}>
                <Ionicons
                  name={resolvedTheme === "dark" ? "sunny-outline" : "moon-outline"}
                  size={17}
                  color={ui.colors.textSecondary}
                />
              </MotionPressable>
            </View>
          </SoftFade>

          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.shell}>
              <FadeInView style={styles.intro}>
                <Text style={styles.eyebrow}>AI-PM MOBILE</Text>
                <Text style={styles.title}>
                  {initialSetup ? t("login.setupTitle") : t("login.welcomeBack")}
                </Text>
                <Text style={styles.body}>
                  {initialSetup ? t("login.setupBody") : t("login.signInBody")}
                </Text>
              </FadeInView>

              <FadeInView delay={70} style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View style={styles.lockIcon}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={ui.colors.accent}
                    />
                  </View>
                  <Text style={styles.formTitle}>
                    {initialSetup ? t("login.setupInfo") : t("login.secureSignIn")}
                  </Text>
                </View>
                <View style={styles.form}>
                  {initialSetup ? (
                    <Field
                      placeholder={t("login.name")}
                      value={name}
                      onChangeText={setName}
                    />
                  ) : null}
                  <Field
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder={t("login.email")}
                    value={email}
                    onChangeText={setEmail}
                  />
                  <Field
                    secureTextEntry
                    autoComplete="password"
                    placeholder={t("login.password")}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={submit}
                  />
                  <Button
                    title={
                      loading
                        ? t("login.processing")
                        : initialSetup
                          ? t("login.setup")
                          : t("login.signIn")
                    }
                    disabled={
                      loading ||
                      !email.trim() ||
                      !password ||
                      (initialSetup && !name.trim())
                    }
                    onPress={submit}
                  />
                  {!initialSetup && telegramConfig.data?.enabled ? (
                    <>
                      <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>{language === 'vi' ? 'hoặc' : 'or'}</Text>
                        <View style={styles.divider} />
                      </View>
                      <Button
                        title={telegramLoading ? (language === 'vi' ? 'Đang chờ Telegram…' : 'Waiting for Telegram…') : (language === 'vi' ? 'Tiếp tục với Telegram' : 'Continue with Telegram')}
                        disabled={loading || telegramLoading}
                        onPress={() => void telegramSignIn()}
                      />
                    </>
                  ) : null}
                </View>
              </FadeInView>

              <SoftFade delay={120}>
                <Text style={styles.footer}>Secure workspace access · AI-PM</Text>
              </SoftFade>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const createStyles = (ui: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.colors.bg },
    dismissArea: { flex: 1 },
    utilityBar: {
      height: 62,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    wordmark: { flexDirection: "row", alignItems: "center", gap: 9 },
    mark: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: ui.colors.accentStrong,
      alignItems: "center",
      justifyContent: "center",
      ...ui.shadow.card,
    },
    markText: {
      color: ui.colors.inverseText,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: -0.3,
    },
    wordmarkText: {
      color: ui.colors.text,
      ...ui.typography.heading,
      fontSize: 15,
    },
    utilityActions: { flexDirection: "row", gap: 8 },
    utilityButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.surface,
    },
    utilityText: {
      color: ui.colors.textSecondary,
      ...ui.typography.caption,
      fontWeight: "800",
    },
    keyboard: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    shell: { width: "100%", maxWidth: 430, alignSelf: "center", gap: 24 },
    intro: { gap: 8 },
    eyebrow: { color: ui.colors.accent, ...ui.typography.eyebrow },
    title: {
      color: ui.colors.text,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
      letterSpacing: -1.05,
    },
    body: {
      color: ui.colors.textSecondary,
      ...ui.typography.body,
      fontSize: 15,
      lineHeight: 23,
      maxWidth: 390,
    },
    formCard: {
      gap: 16,
      padding: 18,
      borderRadius: ui.radius.xl,
      backgroundColor: ui.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ui.colors.border,
      ...ui.shadow.floating,
    },
    formHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
    lockIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ui.colors.accentSoft,
    },
    formTitle: { color: ui.colors.text, ...ui.typography.bodyStrong },
    form: { gap: 11 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
    divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: ui.colors.border },
    dividerText: { color: ui.colors.textMuted, ...ui.typography.caption },
    footer: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      textAlign: "center",
      fontSize: 10.5,
    },
  });
