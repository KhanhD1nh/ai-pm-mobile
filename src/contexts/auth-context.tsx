import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { router } from 'expo-router';
import { authApi, organizationsApi } from '@/services/api';
import { sessionStorage } from '@/lib/storage';
import type { Organization, User } from '@/types';

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

  const hydrate = async () => {
    try {
      const token = await sessionStorage.getToken();
      if (!token) return;
      const me = await authApi.me();
      setUser(me);
      const orgs = await organizationsApi.list();
      setOrganizations(orgs);
      const savedOrg = await sessionStorage.getOrgId();
      const validOrg = orgs.find((org) => org.id === savedOrg)?.id ?? orgs[0]?.id ?? null;
      if (validOrg) await sessionStorage.setOrgId(validOrg);
      setOrgId(validOrg);
    } catch {
      await sessionStorage.clear();
      setUser(null);
      setOrganizations([]);
      setOrgId(null);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => { void hydrate(); }, []);

  const refreshOrganizations = async () => {
    const orgs = await organizationsApi.list();
    setOrganizations(orgs);
    if (orgId && !orgs.some((org) => org.id === orgId)) {
      const next = orgs[0]?.id ?? null;
      setOrgId(next);
      if (next) await sessionStorage.setOrgId(next); else await sessionStorage.clearOrgId();
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    await sessionStorage.setToken(response.token);
    setUser(response.user);
    const orgs = await organizationsApi.list();
    setOrganizations(orgs);
    const next = orgs[0]?.id ?? null;
    if (next) await sessionStorage.setOrgId(next);
    setOrgId(next);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authApi.signup(name, email, password);
    await sessionStorage.setToken(response.token);
    setUser(response.user);
    const orgs = await organizationsApi.list();
    setOrganizations(orgs);
    const next = orgs[0]?.id ?? null;
    if (next) await sessionStorage.setOrgId(next);
    setOrgId(next);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* token may already be expired */ }
    await sessionStorage.clear();
    setUser(null);
    setOrganizations([]);
    setOrgId(null);
    router.replace('/login');
  };

  const selectOrganization = async (nextOrgId: string) => {
    await sessionStorage.setOrgId(nextOrgId);
    setOrgId(nextOrgId);
  };

  const value = useMemo(() => ({ ready, user, organizations, orgId, login, signup, logout, selectOrganization, refreshOrganizations }), [ready, user, organizations, orgId]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
