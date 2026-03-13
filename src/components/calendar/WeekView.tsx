'use client';

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CalendarEvent } from '@/types';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface WeekViewProps {
  calendarId: string;
  events: CalendarEvent[];
  locale?: string;
}

export function WeekView({ calendarId, events, locale = 'en' }: WeekViewProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

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
    router.push(`/en/calendar/${calendarId}/event/${eventId}`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
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
