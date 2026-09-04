import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ai_pm_token';
const ORG_KEY = 'ai_pm_org_id';

export const sessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  getOrgId: () => SecureStore.getItemAsync(ORG_KEY),
  setOrgId: (orgId: string) => SecureStore.setItemAsync(ORG_KEY, orgId),
  clearOrgId: () => SecureStore.deleteItemAsync(ORG_KEY),
  clear: async () => {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(ORG_KEY)]);
  },
};
