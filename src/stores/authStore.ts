import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserRole } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  roleLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: UserRole | null) => void;
  setRoleLoading: (roleLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  roleLoading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) => set({ role }),
  setRoleLoading: (roleLoading) => set({ roleLoading }),
}));
