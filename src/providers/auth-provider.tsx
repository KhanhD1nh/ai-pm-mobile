import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { router } from 'expo-router';
import { authApi } from '@/features/auth/public';
import { organizationsApi } from '@/features/organizations/public';
import { sessionStorage } from '@/infrastructure/auth/session-storage';
import type { Organization, User } from '@/shared/contracts';

type AuthState = {
  ready: boolean;
  user: User | null;
  organizations: Organization[];
  orgId: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void sessionStorage.getToken()
      .then(async (token) => {
        if (!token) return { user: null, organizations: [] as Organization[], orgId: null as string | null };
        const me = await authApi.me();
        const orgs = await organizationsApi.list();
        const savedOrg = await sessionStorage.getOrgId();
        const validOrg = orgs.find((org) => org.id === savedOrg)?.id ?? orgs[0]?.id ?? null;
        if (validOrg) await sessionStorage.setOrgId(validOrg);
        return { user: me, organizations: orgs, orgId: validOrg };
      })
      .catch(async () => {
        await sessionStorage.clear();
        return { user: null, organizations: [] as Organization[], orgId: null as string | null };
      })
      .then((state) => {
        if (cancelled) return;
        setUser(state.user);
        setOrganizations(state.organizations);
        setOrgId(state.orgId);
        setReady(true);
      });

    return () => { cancelled = true; };
  }, []);

  const refreshOrganizations = useCallback(async () => {
    const orgs = await organizationsApi.list();
    setOrganizations(orgs);
    if (orgId && !orgs.some((org) => org.id === orgId)) {
      const next = orgs[0]?.id ?? null;
      setOrgId(next);
      if (next) await sessionStorage.setOrgId(next); else await sessionStorage.clearOrgId();
    }
  }, [orgId]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    await sessionStorage.setToken(response.token);
    const orgs = await organizationsApi.list();
    const next = orgs[0]?.id ?? null;
    if (next) await sessionStorage.setOrgId(next); else await sessionStorage.clearOrgId();
    setUser(response.user);
    setOrganizations(orgs);
    setOrgId(next);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await authApi.signup(name, email, password);
    await sessionStorage.setToken(response.token);
    const orgs = await organizationsApi.list();
    const next = orgs[0]?.id ?? null;
    if (next) await sessionStorage.setOrgId(next); else await sessionStorage.clearOrgId();
    setUser(response.user);
    setOrganizations(orgs);
    setOrgId(next);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* token may already be expired */ }
    await sessionStorage.clear();
    setUser(null);
    setOrganizations([]);
    setOrgId(null);
    router.replace('/login');
  }, []);

  const selectOrganization = useCallback(async (nextOrgId: string) => {
    await sessionStorage.setOrgId(nextOrgId);
    setOrgId(nextOrgId);
  }, []);

  const value = useMemo<AuthState>(() => ({
    ready,
    user,
    organizations,
    orgId,
    login,
    signup,
    logout,
    selectOrganization,
    refreshOrganizations,
  }), [ready, user, organizations, orgId, login, signup, logout, selectOrganization, refreshOrganizations]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
