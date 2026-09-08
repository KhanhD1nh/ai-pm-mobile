import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { request } from "@/infrastructure/networking/api-client";

type ErrorHandler = (error: Error, isFatal?: boolean) => void;
type ErrorUtilsLike = {
  getGlobalHandler?: () => ErrorHandler;
  setGlobalHandler?: (handler: ErrorHandler) => void;
};

let currentRoute: string | null = null;
let installed = false;

function errorUtils(): ErrorUtilsLike | undefined {
  return (globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsLike })
    .ErrorUtils;
}

export function setCrashReporterRoute(route: string | null) {
  currentRoute = route;
}

export async function reportClientError(
  error: unknown,
  options?: {
    fatal?: boolean;
    source?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const value = error instanceof Error ? error : new Error(String(error));
  try {
    await request("/client-errors", {
      method: "POST",
      body: JSON.stringify({
        level: options?.fatal ? "FATAL" : "ERROR",
        source: options?.source ?? "mobile",
        message: value.message || value.name,
        stack: value.stack ?? null,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version ?? null,
        runtimeVersion: Updates.runtimeVersion ?? null,
        updateId: Updates.updateId ?? null,
        route: currentRoute,
        metadata: options?.metadata ?? {},
      }),
    });
  } catch {
    // Diagnostics are best-effort and must never cascade into another failure.
  }
}

export function installGlobalCrashReporter() {
  if (installed || Platform.OS === "web") return () => undefined;
  const utils = errorUtils();
  if (!utils?.setGlobalHandler) return () => undefined;

  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    void reportClientError(error, {
      fatal: Boolean(isFatal),
      source: "global-js-handler",
    });
    previous?.(error, isFatal);
  });
  installed = true;

  return () => {
    if (previous) utils.setGlobalHandler?.(previous);
    installed = false;
  };
}
