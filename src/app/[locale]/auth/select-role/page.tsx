'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { createUserProfile } from '@/lib/firestore/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { UserRole } from '@/types';

function SelectRoleContent() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const { user, loading } = useAuth();
  const setRole = useAuthStore((s) => s.setRole);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectRole = async (role: UserRole) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await createUserProfile(user.uid, {
        displayName: user.displayName || '',
        email: user.email || '',
        role,
      });
      setRole(role);
      toast.success(t('welcome'));
      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl font-bold tracking-tight">
            {t('selectRoleTitle')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('selectRoleSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectRole('teacher')}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <span className="text-lg font-semibold">{t('iAmTeacher')}</span>
              <span className="text-sm text-muted-foreground text-center">
                {t('teacherDesc')}
              </span>
            </button>
            <button
              onClick={() => handleSelectRole('pupil')}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <span className="text-lg font-semibold">{t('iAmPupil')}</span>
              <span className="text-sm text-muted-foreground text-center">
                {t('pupilDesc')}
              </span>
            </button>
          </div>
          {isLoading && (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SelectRolePage() {
  return <SelectRoleContent />;
}
