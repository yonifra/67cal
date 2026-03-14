'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WeekView } from '@/components/calendar/WeekView';
import { ExportCalendarButton } from '@/components/calendar/ExportCalendarButton';
import { InviteModal } from '@/components/invite/InviteModal';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function CalendarContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const { calendar, loading, isOwner, canEdit } = useCalendar(calendarId);
  const { events, loading: eventsLoading, error: eventsError } = useEvents(calendarId);
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">{t('notFound')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('notFoundDesc')}
        </p>
        <Button asChild>
          <Link href={`/${locale}/dashboard`}>{tCommon('goToDashboard')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <ThemeProvider theme={calendar.theme} colorMode={calendar.colorMode || 'light'}>
      <div className="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header — stacks vertically on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href={`/${locale}/dashboard`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight truncate">{calendar.title}</h1>
              {calendar.description && (
                <p className="text-sm text-muted-foreground truncate">{calendar.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ps-10 sm:ps-0">
            <ExportCalendarButton
              calendarId={calendarId}
              calendarTitle={calendar.title}
              events={events}
            />
            {isOwner && (
              <InviteModal
                inviteCode={calendar.inviteCode}
                calendarTitle={calendar.title}
              />
            )}
            {canEdit && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/calendar/${calendarId}/settings`}>
                    <Settings className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('settings')}</span>
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/${locale}/calendar/${calendarId}/event/new`}>
                    <Plus className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('addEvent')}</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : eventsError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('eventsLoadError')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('eventsLoadErrorDesc')}</p>
            <Button asChild>
              <Link href={`/${locale}/dashboard`}>{tCommon('goToDashboard')}</Link>
            </Button>
          </div>
        ) : (
          <WeekView
            calendarId={calendarId}
            events={events}
            locale={calendar.language}
            firstDay={calendar.firstDay ?? 0}
            weekendDays={calendar.weekendDays || 'sat-sun'}
            isOwner={canEdit}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarContent />
    </AuthGuard>
  );
}
