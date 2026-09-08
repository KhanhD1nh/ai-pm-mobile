import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { normalizeError } from "@/shared/errors/app-error";
import { presentError } from "@/shared/errors/present-error";
import { useAuth } from "@/providers/auth-provider";
import { useSetupStatus } from "../queries/use-setup-status";
import { useTelegramConfig } from "../public";
import { sessionStorage } from "@/infrastructure/auth/session-storage";

type TelegramLoginFailure = "network" | "expired" | "open" | "unavailable";

function waitForDelay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
      resolve();
    };

    timeout = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

function waitForAppToBecomeActive(signal: AbortSignal) {
  if (signal.aborted || AppState.currentState === "active")
    return Promise.resolve();

  return new Promise<void>((resolve) => {
    let subscription: ReturnType<typeof AppState.addEventListener> | null =
      null;
    const finish = () => {
      subscription?.remove();
      signal.removeEventListener("abort", finish);
      resolve();
    };

    subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") finish();
    });
    signal.addEventListener("abort", finish, { once: true });
  });
}

function presentTelegramLoginFailure(
  language: "vi" | "en",
  failure: TelegramLoginFailure,
  retry: () => void,
) {
  const vi = language === "vi";
  const copy = {
    network: {
      title: vi ? "Không thể kết nối" : "Could not connect",
      message: vi
        ? "Kết nối mạng bị gián đoạn khi đăng nhập Telegram. Kiểm tra Internet rồi thử lại."
        : "The network connection was interrupted while signing in with Telegram. Check your Internet connection and try again.",
    },
    expired: {
      title: vi ? "Yêu cầu đã hết hạn" : "Request expired",
      message: vi
        ? "Yêu cầu đăng nhập Telegram đã hết hạn. Hãy tạo yêu cầu mới và thử lại."
        : "The Telegram sign-in request expired. Create a new request and try again.",
    },
    open: {
      title: vi ? "Không thể mở Telegram" : "Could not open Telegram",
      message: vi
        ? "Không thể mở liên kết đăng nhập Telegram. Kiểm tra Telegram hoặc trình duyệt trên thiết bị rồi thử lại."
        : "The Telegram sign-in link could not be opened. Check Telegram or your browser and try again.",
    },
    unavailable: {
      title: vi
        ? "Telegram tạm thời không khả dụng"
        : "Telegram is temporarily unavailable",
      message: vi
        ? "AI-PM chưa thể hoàn tất đăng nhập bằng Telegram. Vui lòng thử lại sau."
        : "AI-PM could not complete Telegram sign-in. Please try again shortly.",
    },
  }[failure];

  Alert.alert(copy.title, copy.message, [
    { text: vi ? "Đóng" : "Close", style: "cancel" },
    { text: vi ? "Thử lại" : "Try again", onPress: retry },
  ]);
}

export default function LoginScreen() {
  const { login, signup, user, beginTelegramLogin, pollTelegramLogin } =
    useAuth();
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
      router.replace((destination || "/home") as never);
    });
    return () => {
      cancelled = true;
    };
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

  const telegramSignIn = async (): Promise<void> => {
    telegramAbortRef.current?.abort();
    const controller = new AbortController();
    telegramAbortRef.current = controller;
    setTelegramLoading(true);
    let phase: "nonce" | "open" | "poll" = "nonce";
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      const { nonce, deepLink, expiresIn } = await beginTelegramLogin();
      if (controller.signal.aborted) return;
      phase = "open";
      await Linking.openURL(deepLink);
      phase = "poll";
      let expired = false;
      expiryTimer = setTimeout(() => {
        expired = true;
      }, expiresIn * 1000);
      let consecutiveNetworkErrors = 0;

      // Give iOS/Android enough time to hand the user over to Telegram. Polling
      // while the app is backgrounding can make the native fetch implementation
      // fail with "The network connection was lost" even on a healthy network.
      await waitForDelay(450, controller.signal);
      while (!controller.signal.aborted && !expired) {
        await waitForAppToBecomeActive(controller.signal);
        if (controller.signal.aborted || expired) break;

        let approved = false;
        try {
          approved = await pollTelegramLogin(nonce, controller.signal);
          consecutiveNetworkErrors = 0;
        } catch (error) {
          if (controller.signal.aborted) return;
          const normalized = normalizeError(error);
          if (normalized.code !== "NETWORK_ERROR") throw error;

          // If the request was interrupted exactly while the app moved to the
          // background, wait for foreground instead of surfacing a false error.
          if (AppState.currentState !== "active") continue;

          consecutiveNetworkErrors += 1;
          if (consecutiveNetworkErrors >= 3) throw error;
          await waitForDelay(1200, controller.signal);
          continue;
        }

        if (approved) return;
        await waitForDelay(1800, controller.signal);
      }
      if (controller.signal.aborted) return;
      presentTelegramLoginFailure(
        language,
        "expired",
        () => void telegramSignIn(),
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      const normalized = normalizeError(error);
      const failure: TelegramLoginFailure =
        phase === "open"
          ? "open"
          : normalized.code === "NETWORK_ERROR"
            ? "network"
            : "unavailable";
      presentTelegramLoginFailure(
        language,
        failure,
        () => void telegramSignIn(),
      );
    } finally {
      if (expiryTimer) clearTimeout(expiryTimer);
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
              <MotionPressable
                onPress={toggleTheme}
                style={styles.utilityButton}
              >
                <Ionicons
                  name={
                    resolvedTheme === "dark" ? "sunny-outline" : "moon-outline"
                  }
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
                  {initialSetup
                    ? t("login.setupTitle")
                    : t("login.welcomeBack")}
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
                    {initialSetup
                      ? t("login.setupInfo")
                      : t("login.secureSignIn")}
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
                        <Text style={styles.dividerText}>
                          {language === "vi" ? "hoặc" : "or"}
                        </Text>
                        <View style={styles.divider} />
                      </View>
                      <Button
                        title={
                          telegramLoading
                            ? language === "vi"
                              ? "Đang kết nối Telegram…"
                              : "Connecting to Telegram…"
                            : language === "vi"
                              ? "Tiếp tục với Telegram"
                              : "Continue with Telegram"
                        }
                        disabled={loading || telegramLoading}
                        onPress={() => void telegramSignIn()}
                      />
                    </>
                  ) : null}
                </View>
              </FadeInView>

              <SoftFade delay={120}>
                <Text style={styles.footer}>
                  Secure workspace access · AI-PM
                </Text>
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
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 2,
    },
    divider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: ui.colors.border,
    },
    dividerText: { color: ui.colors.textMuted, ...ui.typography.caption },
    footer: {
      color: ui.colors.textMuted,
      ...ui.typography.caption,
      textAlign: "center",
      fontSize: 10.5,
    },
  });
