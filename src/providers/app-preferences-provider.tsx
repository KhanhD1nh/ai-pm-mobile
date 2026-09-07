import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '@/shared/components/ui/theme';
import {
  AppPreferencesContext,
  translate,
  type AppLanguage,
  type ThemePreference,
} from '@/shared/preferences/app-preferences-context';
import { preferencesStorage } from '@/infrastructure/persistence/preferences-storage';

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemeState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<AppLanguage>('vi');

  useEffect(() => {
    void Promise.all([preferencesStorage.getTheme(), preferencesStorage.getLanguage()]).then(([theme, lang]) => {
      if (theme) setThemeState(theme);
      if (lang) setLanguageState(lang);
    });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themePreference === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themePreference;

  const value = useMemo(() => ({
    themePreference,
    resolvedTheme,
    theme: resolvedTheme === 'light' ? lightTheme : darkTheme,
    language,
    setThemePreference: async (next: ThemePreference) => {
      setThemeState(next);
      await preferencesStorage.setTheme(next);
    },
    setLanguage: async (next: AppLanguage) => {
      setLanguageState(next);
      await preferencesStorage.setLanguage(next);
    },
    t: (key: Parameters<typeof translate>[1]) => translate(language, key),
  }), [language, resolvedTheme, themePreference]);

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}
