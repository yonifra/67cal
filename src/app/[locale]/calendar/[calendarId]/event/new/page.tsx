'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { EventFormData } from '@/types';
import { createEvent } from '@/lib/firestore/events';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EventForm } from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function NewEventContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const calendarId = params.calendarId as string;
  const { calendar, loading, canEdit } = useCalendar(calendarId);
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // Read pre-filled start/end times from query params (set by WeekView drag-select)
  const prefillStart = searchParams.get('start') || '';
  const prefillEnd = searchParams.get('end') || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar || !canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">{t('accessDenied')}</h2>
        <p className="text-muted-foreground">{t('accessDeniedDesc')}</p>
      </div>
    );
  }

  const handleSubmit = async (data: EventFormData) => {
    try {
      await createEvent(calendarId, data);
      toast.success(t('eventCreated'));
      router.push(`/${locale}/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const initialData: Partial<EventFormData> | undefined =
    prefillStart || prefillEnd
      ? { startTime: prefillStart, endTime: prefillEnd }
      : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${locale}/calendar/${calendarId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('backToCalendar')}
        </Link>
      </Button>
      <EventForm onSubmit={handleSubmit} initialData={initialData} />
    </div>
  );
}

export default function NewEventPage() {
  return (
    <AuthGuard>
      <NewEventContent />
    </AuthGuard>
  );
}
