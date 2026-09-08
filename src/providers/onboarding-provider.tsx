import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { View } from "react-native";
import { OnboardingScreen } from "@/features/onboarding/public";
import { onboardingStorage } from "@/infrastructure/persistence/onboarding-storage";
import { useAppPreferences } from "@/shared/preferences/app-preferences-context";

type GateState = "checking" | "show" | "complete";

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { theme } = useAppPreferences();
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let active = true;
    void onboardingStorage.shouldShow().then((shouldShow) => {
      if (active) setState(shouldShow ? "show" : "complete");
    });
    return () => {
      active = false;
    };
  }, []);

  const complete = useCallback(async () => {
    try {
      await onboardingStorage.complete();
    } finally {
      // Persistence is best-effort; a storage failure must not trap the user
      // on onboarding for the rest of the current session.
      setState("complete");
    }
  }, []);

  if (state === "checking")
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
  if (state === "show") return <OnboardingScreen onComplete={complete} />;
  return children;
}
