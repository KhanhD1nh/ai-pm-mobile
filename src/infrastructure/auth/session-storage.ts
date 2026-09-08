import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "ai_pm_token";
const ORG_KEY = "ai_pm_org_id";
const USER_KEY = "ai_pm_user_id";
const PENDING_DESTINATION_KEY = "ai_pm_pending_destination";

let tokenCache: string | null | undefined;
let orgCache: string | null | undefined;
let userCache: string | null | undefined;

async function getItem(key: string) {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const sessionStorage = {
  getToken: async () => {
    if (tokenCache !== undefined) return tokenCache;
    tokenCache = await getItem(TOKEN_KEY);
    return tokenCache;
  },
  setToken: async (token: string) => {
    tokenCache = token;
    await setItem(TOKEN_KEY, token);
  },
  getOrgId: async () => {
    if (orgCache !== undefined) return orgCache;
    orgCache = await getItem(ORG_KEY);
    return orgCache;
  },
  setOrgId: async (orgId: string) => {
    orgCache = orgId;
    await setItem(ORG_KEY, orgId);
  },
  getUserId: async () => {
    if (userCache !== undefined) return userCache;
    userCache = await getItem(USER_KEY);
    return userCache;
  },
  setUserId: async (userId: string) => {
    userCache = userId;
    await setItem(USER_KEY, userId);
  },
  clearOrgId: async () => {
    orgCache = null;
    await deleteItem(ORG_KEY);
  },
  getPendingDestination: () => getItem(PENDING_DESTINATION_KEY),
  setPendingDestination: (destination: string) =>
    setItem(PENDING_DESTINATION_KEY, destination),
  clearPendingDestination: () => deleteItem(PENDING_DESTINATION_KEY),
  clear: async () => {
    tokenCache = null;
    orgCache = null;
    userCache = null;
    await Promise.all([
      deleteItem(TOKEN_KEY),
      deleteItem(ORG_KEY),
      deleteItem(USER_KEY),
      deleteItem(PENDING_DESTINATION_KEY),
    ]);
  },
};
