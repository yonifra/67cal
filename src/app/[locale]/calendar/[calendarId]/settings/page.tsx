'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarFormData, Calendar } from '@/types';
import { getCalendar, updateCalendar, deleteCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarForm } from '@/components/calendar/CalendarForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function SettingsContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const user = useAuthStore((s) => s.user);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    async function fetch() {
      try {
        const cal = await getCalendar(calendarId);
        if (cal && cal.ownerId === user?.uid) {
          setCalendar(cal);
        } else {
          toast.error(t('notFoundOrDenied'));
          router.push(`/${locale}/dashboard`);
        }
      } catch {
        toast.error(t('loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    if (user) fetch();
  }, [calendarId, user, router, t, locale]);

  const handleSubmit = async (data: CalendarFormData) => {
    try {
      await updateCalendar(calendarId, data);
      toast.success(t('calendarUpdated'));
      router.push(`/${locale}/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await deleteCalendar(calendarId);
      toast.success(t('calendarDeleted'));
      router.push(`/${locale}/dashboard`);
    } catch {
      toast.error(tCommon('error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${locale}/calendar/${calendarId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('backToCalendar')}
        </Link>
      </Button>

      <CalendarForm
        initialData={{
          title: calendar.title,
          description: calendar.description,
          theme: calendar.theme,
          language: calendar.language,
          colorMode: calendar.colorMode || 'light',
          firstDay: calendar.firstDay ?? 0,
          weekendDays: calendar.weekendDays || 'sat-sun',
        }}
        onSubmit={handleSubmit}
        isEditing
      />

      <Separator className="my-8" />

      <div className="rounded-sm border border-destructive/50 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">{t('dangerZone')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('dangerZoneDesc')}
        </p>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
