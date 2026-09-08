import { Platform } from "react-native";

const systemFont =
  Platform.OS === "web"
    ? 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    : undefined;

const shared = {
  header: {
    actionSize: Platform.OS === "android" ? 48 : 44,
    iconSize: 22,
    horizontalInset: 16,
    verticalInset: 4,
  },
  radius: {
    xs: 8,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    round: 999,
  },
  spacing: {
    xxs: 4,
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  typography: {
    display: {
      fontFamily: systemFont,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "700" as const,
      letterSpacing: -0.9,
    },
    hero: {
      fontFamily: systemFont,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700" as const,
      letterSpacing: -1.05,
    },
    screenTitle: {
      fontFamily: systemFont,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "700" as const,
      letterSpacing: -0.8,
    },
    metric: {
      fontFamily: systemFont,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "700" as const,
      letterSpacing: -0.9,
    },
    title: {
      fontFamily: systemFont,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "700" as const,
      letterSpacing: -0.4,
    },
    heading: {
      fontFamily: systemFont,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "600" as const,
      letterSpacing: -0.12,
    },
    body: {
      fontFamily: systemFont,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "400" as const,
    },
    bodyStrong: {
      fontFamily: systemFont,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "600" as const,
    },
    caption: {
      fontFamily: systemFont,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500" as const,
    },
    eyebrow: {
      fontFamily: systemFont,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "600" as const,
      letterSpacing: 0.6,
    },
  },
  motion: {
    fast: 120,
    normal: 200,
    slow: 280,
  },
} as const;

export const lightTheme = {
  colors: {
    // Keep mobile layout/radius native, but mirror the web palette from
    // ai-pm-frontend-v2/src/styles/global.css so both clients feel like one app.
    bg: "#F4F5F7",
    bgElevated: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceRaised: "#EBECF0",
    surfaceSoft: "#F4F5F7",
    surfaceAccent: "#DEEBFF",
    surfaceContainer: "#F4F5F7",
    surfaceContainerHigh: "#EBECF0",
    primaryContainer: "#DEEBFF",
    onPrimaryContainer: "#0747A6",
    border: "#DFE1E6",
    borderStrong: "#C1C7D0",
    text: "#172B4D",
    inverseText: "#FFFFFF",
    textSecondary: "#626F86",
    textMuted: "#8993A5",
    accent: "#0065FF",
    accentStrong: "#0052CC",
    accentSoft: "#DEEBFF",
    success: "#36B37E",
    successSoft: "#E3FCEF",
    warning: "#FFAB00",
    warningSoft: "#FFFAE6",
    danger: "#E34935",
    dangerSoft: "#FFEBE6",
    priorityUrgent: "#E34935",
    priorityHigh: "#FF7452",
    priorityMedium: "#FFAB00",
    priorityLow: "#0065FF",
    statusBacklog: "#626F86",
    statusTodo: "#42526E",
    statusInProgress: "#0052CC",
    statusInReview: "#6554C0",
    statusDone: "#36B37E",
    statusCanceled: "#8993A5",
    overlay: "rgba(9, 30, 66, 0.54)",
    shadow: "#091E42",
  },
  shadow: {
    card: {
      shadowColor: "#091E42",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 0,
    },
    floating: {
      shadowColor: "#091E42",
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 9 },
      elevation: 5,
    },
  },
  ...shared,
} as const;

export const darkTheme = {
  colors: {
    bg: "#161A1D",
    bgElevated: "#22272B",
    surface: "#22272B",
    surfaceRaised: "#2C333A",
    surfaceSoft: "#161A1D",
    surfaceAccent: "#1C2B41",
    surfaceContainer: "#22272B",
    surfaceContainerHigh: "#2C333A",
    primaryContainer: "#1C2B41",
    onPrimaryContainer: "#85B8FF",
    border: "#444D56",
    borderStrong: "#596773",
    text: "#E6EDF3",
    inverseText: "#0D1424",
    textSecondary: "#B8C4D0",
    textMuted: "#95A3B1",
    accent: "#85B8FF",
    accentStrong: "#579DFF",
    accentSoft: "#1C2B41",
    success: "#57D9A3",
    successSoft: "rgba(87, 217, 163, 0.14)",
    warning: "#E2B203",
    warningSoft: "rgba(226, 178, 3, 0.14)",
    danger: "#FD9891",
    dangerSoft: "rgba(253, 152, 145, 0.14)",
    priorityUrgent: "#FD9891",
    priorityHigh: "#FEA362",
    priorityMedium: "#E2B203",
    priorityLow: "#85B8FF",
    statusBacklog: "#738496",
    statusTodo: "#8C9BAB",
    statusInProgress: "#579DFF",
    statusInReview: "#9F8FEF",
    statusDone: "#57D9A3",
    statusCanceled: "#738496",
    overlay: "rgba(9, 30, 66, 0.70)",
    shadow: "#000000",
  },
  shadow: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    floating: {
      shadowColor: "#000000",
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  },
  ...shared,
} as const;

export type AppTheme = typeof darkTheme | typeof lightTheme;

export function priorityColor(theme: AppTheme, priority?: string | null) {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return theme.colors.priorityUrgent;
    case "HIGH":
      return theme.colors.priorityHigh;
    case "MEDIUM":
      return theme.colors.priorityMedium;
    case "LOW":
      return theme.colors.priorityLow;
    default:
      return theme.colors.textMuted;
  }
}

export function statusCategoryColor(theme: AppTheme, category?: string | null) {
  switch (category?.toUpperCase()) {
    case "BACKLOG":
      return theme.colors.statusBacklog;
    case "TODO":
      return theme.colors.statusTodo;
    case "IN_PROGRESS":
      return theme.colors.statusInProgress;
    case "IN_REVIEW":
      return theme.colors.statusInReview;
    case "DONE":
      return theme.colors.statusDone;
    case "REJECTED":
      return theme.colors.danger;
    case "CANCELED":
      return theme.colors.statusCanceled;
    default:
      return theme.colors.textMuted;
  }
}

export const ui = lightTheme;
