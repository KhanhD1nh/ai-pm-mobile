export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  is_system_owner?: boolean;
  isSystemOwner?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
