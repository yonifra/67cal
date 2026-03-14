import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserRole } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  roleLoading: boolean;
  avatarStyle: string | null;
  avatarSeed: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: UserRole | null) => void;
  setRoleLoading: (roleLoading: boolean) => void;
  setAvatar: (style: string | null, seed: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  roleLoading: true,
  avatarStyle: null,
  avatarSeed: null,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) => set({ role }),
  setRoleLoading: (roleLoading) => set({ roleLoading }),
  setAvatar: (avatarStyle, avatarSeed) => set({ avatarStyle, avatarSeed }),
}));
