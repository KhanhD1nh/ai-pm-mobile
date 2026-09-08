import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "ai_pm_onboarding_v1";
const COMPLETE_VALUE = "complete";

export const onboardingStorage = {
  async shouldShow(): Promise<boolean> {
    try {
      if ((await AsyncStorage.getItem(ONBOARDING_KEY)) === COMPLETE_VALUE)
        return false;

      const keys = await AsyncStorage.getAllKeys();
      // This marker ships after the app already had persisted preferences,
      // query cache and device state. Any pre-existing AsyncStorage data means
      // this is an upgrade, not a fresh install, so do not surprise that user
      // with onboarding after updating the app.
      const isExistingInstall = keys.some((key) => key !== ONBOARDING_KEY);
      if (isExistingInstall) {
        await AsyncStorage.setItem(ONBOARDING_KEY, COMPLETE_VALUE);
        return false;
      }

      return true;
    } catch {
      // Storage failure must never block access to the app.
      return false;
    }
  },

  async complete(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, COMPLETE_VALUE);
  },
};
