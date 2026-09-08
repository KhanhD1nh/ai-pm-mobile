import type { PropsWithChildren } from "react";
import { AppPreferencesProvider } from "./app-preferences-provider";
import { AuthProvider } from "./auth-provider";
import { OnboardingProvider } from "./onboarding-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppPreferencesProvider>
      <OnboardingProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </OnboardingProvider>
    </AppPreferencesProvider>
  );
}
