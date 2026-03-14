'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthChange } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore/users';

export function useAuth() {
  const { user, loading, role, roleLoading, setUser, setRole, setRoleLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // If role is already set in the store (e.g. by RegisterForm after
        // calling createUserProfile), skip the Firestore fetch to avoid a
        // race condition where onAuthStateChanged fires before the profile
        // document has been written.
        const currentRole = useAuthStore.getState().role;
        if (currentRole !== null) {
          // Role was already set (e.g. by RegisterForm). Still try to load
          // avatar data from Firestore if profile exists.
          getUserProfile(firebaseUser.uid).then((profile) => {
            if (profile) {
              useAuthStore.getState().setAvatar(
                profile.avatarStyle ?? null,
                profile.avatarSeed ?? null
              );
            }
          }).catch(() => { /* ignore */ });
          setRoleLoading(false);
          return;
        }
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setRole(profile?.role ?? null);
          useAuthStore.getState().setAvatar(
            profile?.avatarStyle ?? null,
            profile?.avatarSeed ?? null
          );
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setRole(null);
        }
      } else {
        setRole(null);
        useAuthStore.getState().setAvatar(null, null);
      }
      setRoleLoading(false);
    });
    return unsubscribe;
  }, [setUser, setRole, setRoleLoading]);

  return { user, loading, role, roleLoading };
}
