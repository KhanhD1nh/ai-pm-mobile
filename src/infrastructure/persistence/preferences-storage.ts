import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppLanguage,
  ThemePreference,
} from "@/shared/preferences/app-preferences-context";

const THEME_KEY = "ai_pm_theme";
const LANGUAGE_KEY = "ai_pm_language";

export const preferencesStorage = {
  async getTheme(): Promise<ThemePreference | null> {
    const value = await AsyncStorage.getItem(THEME_KEY);
    return value === "system" || value === "light" || value === "dark"
      ? value
      : null;
  },
  async setTheme(value: ThemePreference) {
    await AsyncStorage.setItem(THEME_KEY, value);
  },
  async getLanguage(): Promise<AppLanguage | null> {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === "vi" || value === "en" ? value : null;
  },
  async setLanguage(value: AppLanguage) {
    await AsyncStorage.setItem(LANGUAGE_KEY, value);
  },
};
