'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarFormData } from '@/types';
import { createCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarForm } from '@/components/calendar/CalendarForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function NewCalendarContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const t = useTranslations('calendar');
  const ta = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    if (role === 'pupil') {
      toast.error(ta('pupilCannotCreate'));
      router.push(`/${locale}/dashboard`);
    }
  }, [role, router, locale, ta]);

  const handleSubmit = async (data: CalendarFormData) => {
    if (!user) return;
    try {
      const calendarId = await createCalendar(user.uid, data);
      toast.success(t('calendarCreated'));
      router.push(`/${locale}/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  if (role === 'pupil') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${locale}/dashboard`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('backToDashboard')}
        </Link>
      </Button>
      <CalendarForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function NewCalendarPage() {
  return (
    <AuthGuard>
      <NewCalendarContent />
    </AuthGuard>
  );
}
