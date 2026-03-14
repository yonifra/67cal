'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarEvent } from '@/types';
import { getEvent, cancelEvent, getRecurrenceGroupEvents } from '@/lib/firestore/events';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { MeetingLinkButton } from '@/components/calendar/MeetingLinkButton';
import { ExportButton } from '@/components/calendar/ExportButton';
import { CancelEventModal } from '@/components/calendar/CancelEventModal';
import { ChatThread } from '@/components/chat/ChatThread';
import { FileList } from '@/components/files/FileList';
import { FileUploader } from '@/components/files/FileUploader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Ban,
  Loader2,
  FileText,
  Repeat,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const eventId = params.eventId as string;
  const { calendar, loading: calLoading, isOwner, canEdit } = useCalendar(calendarId);
  const { user } = useAuth();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [recurrenceTotal, setRecurrenceTotal] = useState<number | null>(null);
  const t = useTranslations('event');
  const tFiles = useTranslations('files');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    async function fetch() {
      try {
        const ev = await getEvent(calendarId, eventId);
        setEvent(ev);
      } catch {
        toast.error(t('loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [calendarId, eventId]);

  // Fetch recurrence group size when the event belongs to one
  useEffect(() => {
    if (!event?.recurrenceGroupId) return;
    getRecurrenceGroupEvents(calendarId, event.recurrenceGroupId).then((events) => {
      setRecurrenceTotal(events.length);
    });
  }, [calendarId, event?.recurrenceGroupId]);

  const handleCancel = async (reason: string) => {
    try {
      await cancelEvent(calendarId, eventId, reason, user?.uid);
      setEvent((prev) =>
        prev ? { ...prev, status: 'cancelled', cancelReason: reason } : null
      );
      toast.success(t('eventCancelled'));
    } catch {
      toast.error(t('cancelFailed'));
    }
  };

  if (loading || calLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !calendar) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">{t('notFound')}</h2>
        <Button asChild>
          <Link href={`/${locale}/calendar/${calendarId}`}>{tCommon('backToCalendar')}</Link>
        </Button>
      </div>
    );
  }

  const isCancelled = event.status === 'cancelled';
  const startDate = event.startTime?.toDate ? event.startTime.toDate() : new Date();
  const endDate = event.endTime?.toDate ? event.endTime.toDate() : new Date();

  return (
    <ThemeProvider theme={calendar.theme} colorMode={calendar.colorMode || 'light'}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <Button variant="ghost" asChild className="mb-4 sm:mb-6">
          <Link href={`/${locale}/calendar/${calendarId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('backToCalendar')}
          </Link>
        </Button>

        {/* Event Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1
                  className={`font-heading text-2xl sm:text-3xl font-bold tracking-tight ${isCancelled ? 'line-through text-muted-foreground' : ''}`}
                >
                  {event.title}
                </h1>
                {isCancelled && (
                  <Badge variant="destructive" className="text-sm">
                    <Ban className="mr-1 h-3 w-3" />
                    {t('status.cancelled')}
                  </Badge>
                )}
                {event.recurrenceGroupId && recurrenceTotal !== null && event.recurrenceIndex !== null && (
                  <Badge variant="secondary" className="text-sm">
                    <Repeat className="mr-1 h-3 w-3" />
                    {t('recurringBadge')} — {t('recurringOccurrence', { index: (event.recurrenceIndex ?? 0) + 1, total: recurrenceTotal })}
                  </Badge>
                )}
              </div>
              {event.description && (
                <p className="text-muted-foreground">{event.description}</p>
              )}
              {isCancelled && event.cancelReason && (
                <div className="mt-2 rounded-sm bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  <strong>{t('reason')}</strong> {event.cancelReason}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ExportButton event={event} />
              {canEdit && !isCancelled && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${locale}/calendar/${calendarId}/event/${eventId}/edit`}>
                      <Edit className="sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{tCommon('edit')}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    <Ban className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{tCommon('cancel')}</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Date/Time and Meeting Link */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(startDate, 'h:mm a')} — {format(endDate, 'h:mm a')}
              </span>
            </div>
          </div>

          {event.meetingLink && !isCancelled && (
            <div className="mt-4">
              <MeetingLinkButton
                meetingLink={event.meetingLink}
                provider={event.meetingProvider}
              />
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Content Grid: Files + Chat */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {tFiles('title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <FileUploader
                  calendarId={calendarId}
                  eventId={eventId}
                  onUploadComplete={() => setFileRefreshKey((k) => k + 1)}
                />
              )}
              <FileList
                calendarId={calendarId}
                eventId={eventId}
                isOwner={canEdit}
                refreshKey={fileRefreshKey}
              />
            </CardContent>
          </Card>

          {/* Chat Section */}
          <ChatThread
            calendarId={calendarId}
            eventId={eventId}
            isOwner={canEdit}
          />
        </div>

        <CancelEventModal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancel}
          eventTitle={event.title}
        />
      </div>
    </ThemeProvider>
  );
}

export default function EventDetailPage() {
  return (
    <AuthGuard>
      <EventDetailContent />
    </AuthGuard>
  );
}
