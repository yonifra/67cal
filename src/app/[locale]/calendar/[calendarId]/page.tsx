'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCalendar } from '@/hooks/useCalendar';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WeekView } from '@/components/calendar/WeekView';
import { InviteModal } from '@/components/invite/InviteModal';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';

function CalendarContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const { calendar, loading, isOwner } = useCalendar(calendarId);
  const { events, loading: eventsLoading } = useEvents(calendarId);

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
        <h2 className="text-xl font-semibold mb-2">Calendar not found</h2>
        <p className="text-muted-foreground mb-4">
          This calendar may have been deleted or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/en/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <ThemeProvider theme={calendar.theme}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/en/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{calendar.title}</h1>
              {calendar.description && (
                <p className="text-sm text-muted-foreground">{calendar.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <InviteModal
                  inviteCode={calendar.inviteCode}
                  calendarTitle={calendar.title}
                />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/en/calendar/${calendarId}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/en/calendar/${calendarId}/event/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
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
        ) : (
          <WeekView
            calendarId={calendarId}
            events={events}
            locale={calendar.language}
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
