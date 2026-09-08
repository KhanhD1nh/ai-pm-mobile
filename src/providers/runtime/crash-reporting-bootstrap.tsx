import { useEffect } from "react";
import { usePathname } from "expo-router";
import {
  installGlobalCrashReporter,
  setCrashReporterRoute,
} from "@/infrastructure/diagnostics/crash-reporter";

export function CrashReportingBootstrap() {
  const pathname = usePathname();

  useEffect(() => setCrashReporterRoute(pathname), [pathname]);
  useEffect(() => installGlobalCrashReporter(), []);
  return null;
}
