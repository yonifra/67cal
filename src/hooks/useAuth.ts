'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange } from '@/lib/auth';

export function useAuth() {
  const { user, loading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, [setUser]);

  return { user, loading };
}
