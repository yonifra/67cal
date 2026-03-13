'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarEvent, FirstDay, WeekendDays } from '@/types';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface WeekViewProps {
  calendarId: string;
  events: CalendarEvent[];
  locale?: string;
  firstDay?: FirstDay;
  weekendDays?: WeekendDays;
}

export function WeekView({
  calendarId,
  events,
  locale = 'en',
  firstDay = 0,
  weekendDays = 'sat-sun',
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
    },
  }));

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    router.push(`/${siteLocale}/calendar/${calendarId}/event/${eventId}`);
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        events={fcEvents}
        eventClick={handleEventClick}
        direction={locale === 'he' ? 'rtl' : 'ltr'}
        locale={locale}
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
