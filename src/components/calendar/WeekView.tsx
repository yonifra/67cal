'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import { CalendarEvent, FirstDay, WeekendDays } from '@/types';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface WeekViewProps {
  calendarId: string;
  events: CalendarEvent[];
  locale?: string;
  firstDay?: FirstDay;
  weekendDays?: WeekendDays;
  isOwner?: boolean;
}

export function WeekView({
  calendarId,
  events,
  locale = 'en',
  firstDay = 0,
  weekendDays = 'sat-sun',
  isOwner = false,
}: WeekViewProps) {
  const router = useRouter();
  const siteLocale = useLocale();
  const calendarRef = useRef<FullCalendar>(null);

  // Compute hidden days based on weekend configuration
  // FullCalendar uses 0=Sunday, 1=Monday, ... 5=Friday, 6=Saturday
  const hiddenDays: number[] = [];
  // We don't hide weekend days — we show all 7 days
  // But we do configure which days count as weekends for styling

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime?.toDate ? event.startTime.toDate() : new Date(),
    end: event.endTime?.toDate ? event.endTime.toDate() : new Date(),
    backgroundColor: event.status === 'cancelled' ? 'hsl(var(--muted))' : undefined,
    borderColor: event.status === 'cancelled' ? 'hsl(var(--muted-foreground))' : undefined,
    textColor: event.status === 'cancelled' ? 'hsl(var(--muted-foreground))' : undefined,
    classNames: event.status === 'cancelled' ? ['opacity-60', 'line-through'] : [],
    extendedProps: {
      status: event.status,
      meetingProvider: event.meetingProvider,
      cancelReason: event.cancelReason,
      isRecurring: !!(event.recurrenceGroupId),
    },
  }));

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    router.push(`/${siteLocale}/calendar/${calendarId}/event/${eventId}`);
  };

  // When the owner clicks or drags on the grid, navigate to the new event
  // page with the selected start/end times pre-filled as query params.
  const handleSelect = (info: any) => {
    if (!isOwner) return;

    // Format dates as datetime-local values (YYYY-MM-DDTHH:MM)
    const formatForInput = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const start = formatForInput(info.start);
    const end = formatForInput(info.end);

    router.push(
      `/${siteLocale}/calendar/${calendarId}/event/new?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locales={[heLocale]}
        locale={locale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        events={fcEvents}
        eventClick={handleEventClick}
        selectable={isOwner}
        selectMirror={isOwner}
        select={handleSelect}
        direction={locale === 'he' ? 'rtl' : 'ltr'}
        firstDay={firstDay}
        hiddenDays={hiddenDays}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        nowIndicator
        eventDisplay="block"
        dayMaxEvents={3}
        weekends
        slotDuration="00:30:00"
        expandRows
      />
    </div>
  );
}
