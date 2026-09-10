import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/public";
import { organizationsApi } from "@/features/organizations/public";
import { sessionStorage } from "@/infrastructure/auth/session-storage";
import { clearOfflineMutationQueue } from "@/infrastructure/persistence/offline-mutation-queue";
import {
  clearAiPmFocusWidget,
  ensureAiPmFocusWidgetSnapshot,
} from "@/infrastructure/widgets/ai-pm-widget-service";
import { queryPersister } from "@/infrastructure/persistence/query-persister";
import type { AuthResponse, Organization, User } from "@/shared/contracts";

type AuthState = {
  ready: boolean;
  user: User | null;
  organizations: Organization[];
  orgId: string | null;
  login: (email: string, password: string) => Promise<void>;
  beginTelegramLogin: () => Promise<{
    nonce: string;
    deepLink: string;
    expiresIn: number;
  }>;
  pollTelegramLogin: (nonce: string, signal?: AbortSignal) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  const clearAccountCache = useCallback(async () => {
    queryClient.clear();
    await queryPersister.removeClient();
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    void ensureAiPmFocusWidgetSnapshot();

    void sessionStorage
      .getToken()
      .then(async (token) => {
        if (!token) {
          await clearAccountCache();
          return {
            user: null,
            organizations: [] as Organization[],
            orgId: null as string | null,
          };
        }
        const me = await authApi.me();
        await sessionStorage.setUserId(me.id);
        const orgs = await organizationsApi.list();
        const savedOrg = await sessionStorage.getOrgId();
        const validOrg =
          orgs.find((org) => org.id === savedOrg)?.id ?? orgs[0]?.id ?? null;
        if (validOrg) await sessionStorage.setOrgId(validOrg);
        return { user: me, organizations: orgs, orgId: validOrg };
      })
      .catch(async () => {
        await sessionStorage.clear();
        await clearAccountCache();
        return {
          user: null,
          organizations: [] as Organization[],
          orgId: null as string | null,
        };
      })
      .then((state) => {
        if (cancelled) return;
        setUser(state.user);
        setOrganizations(state.organizations);
        setOrgId(state.orgId);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clearAccountCache]);

  const refreshOrganizations = useCallback(async () => {
    const orgs = await organizationsApi.list();
    setOrganizations(orgs);
    if (orgId && !orgs.some((org) => org.id === orgId)) {
      const next = orgs[0]?.id ?? null;
      setOrgId(next);
      if (next) await sessionStorage.setOrgId(next);
      else await sessionStorage.clearOrgId();
    }
  }, [orgId]);

  const establishSession = useCallback(
    async (response: AuthResponse) => {
      await clearAccountCache();
      await sessionStorage.setToken(response.token);
      await sessionStorage.setUserId(response.user.id);
      const orgs = await organizationsApi.list();
      const savedOrg = await sessionStorage.getOrgId();
      const next =
        orgs.find((org) => org.id === savedOrg)?.id ?? orgs[0]?.id ?? null;
      if (next) await sessionStorage.setOrgId(next);
      else await sessionStorage.clearOrgId();
      setUser(response.user);
      setOrganizations(orgs);
      setOrgId(next);
    },
    [clearAccountCache],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (__DEV__) console.log("[AUTH] login:start", { email });
      const response = await authApi.login(email, password);
      if (__DEV__)
        console.log("[AUTH] login:api-success", { userId: response.user.id });
      await establishSession(response);
    },
    [establishSession],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      if (__DEV__) console.log("[AUTH] signup:start", { email });
      const response = await authApi.signup(name, email, password);
      if (__DEV__)
        console.log("[AUTH] signup:api-success", { userId: response.user.id });
      await establishSession(response);
    },
    [establishSession],
  );

  const beginTelegramLogin = useCallback(
    () => authApi.telegramLoginNonce(),
    [],
  );

  const pollTelegramLogin = useCallback(
    async (nonce: string, signal?: AbortSignal) => {
      const result = await authApi.telegramLoginPoll(nonce, signal);
      if (!result.approved || !result.token || !result.user) return false;
      await establishSession({ token: result.token, user: result.user });
      return true;
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* token may already be expired */
    }
    await sessionStorage.clear();
    await clearOfflineMutationQueue();
    await clearAccountCache();
    await clearAiPmFocusWidget();
    setUser(null);
    setOrganizations([]);
    setOrgId(null);
    router.replace("/login");
  }, [clearAccountCache]);

  const selectOrganization = useCallback(async (nextOrgId: string) => {
    await sessionStorage.setOrgId(nextOrgId);
    setOrgId(nextOrgId);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      organizations,
      orgId,
      login,
      beginTelegramLogin,
      pollTelegramLogin,
      signup,
      logout,
      selectOrganization,
      refreshOrganizations,
    }),
    [
      ready,
      user,
      organizations,
      orgId,
      login,
      beginTelegramLogin,
      pollTelegramLogin,
      signup,
      logout,
      selectOrganization,
      refreshOrganizations,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
