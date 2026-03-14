'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, role, roleLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, locale, pathname]);

  useEffect(() => {
    if (!loading && user && !roleLoading && role === null) {
      router.push(`/${locale}/auth/select-role`);
    }
  }, [user, loading, role, roleLoading, router, locale]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (role === null) return null;

  return <>{children}</>;
}
