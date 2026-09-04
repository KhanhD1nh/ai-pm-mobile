export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
  role?: OrganizationRole;
}

export interface OrganizationMembership {
  id: string;
  role: OrganizationRole;
  name?: string;
  email?: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AiBudget {
  monthlyUsdLimit: number;
  currentUsageUsd: number;
  alertThresholdPct: number;
  resetDay: number;
}
