'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
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

// SVG icons for meeting providers (inline to avoid extra imports)
const providerIcons: Record<string, { icon: string; label: string }> = {
  zoom: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    label: 'Zoom',
  },
  meet: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    label: 'Meet',
  },
  teams: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    label: 'Teams',
  },
  other: {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    label: 'Link',
  },
};

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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport and switch to day view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Switch FullCalendar view when mobile state changes
  const handleWindowResize = useCallback(() => {
    const calApi = calendarRef.current?.getApi();
    if (!calApi) return;
    const mobile = window.innerWidth < 768;
    const currentView = calApi.view.type;
    if (mobile && currentView === 'timeGridWeek') {
      calApi.changeView('timeGridDay');
    } else if (!mobile && currentView === 'timeGridDay') {
      calApi.changeView('timeGridWeek');
    }
  }, []);

  // Compute hidden days based on weekend configuration
  const hiddenDays: number[] = [];

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime?.toDate ? event.startTime.toDate() : new Date(),
    end: event.endTime?.toDate ? event.endTime.toDate() : new Date(),
    backgroundColor: event.status === 'cancelled' ? 'hsl(var(--muted))' : undefined,
    borderColor: event.status === 'cancelled' ? 'hsl(var(--muted-foreground))' : undefined,
    textColor: event.status === 'cancelled' ? 'hsl(var(--muted-foreground))' : undefined,
    classNames: event.status === 'cancelled'
      ? ['fc-event-cancelled']
      : [],
    extendedProps: {
      status: event.status,
      meetingProvider: event.meetingProvider,
      cancelReason: event.cancelReason,
      isRecurring: !!(event.recurrenceGroupId),
    },
  }));

  // Custom event rendering: show meeting provider icon inside event blocks
  const renderEventContent = (eventInfo: any) => {
    const { meetingProvider, status } = eventInfo.event.extendedProps;
    const isCancelled = status === 'cancelled';
    const provider = meetingProvider && providerIcons[meetingProvider]
      ? providerIcons[meetingProvider]
      : meetingProvider ? providerIcons.other : null;

    return (
      <div className="fc-event-main-content">
        <div className={`fc-event-title-container ${isCancelled ? 'line-through' : ''}`}>
          {eventInfo.timeText && (
            <div className="fc-event-time">{eventInfo.timeText}</div>
          )}
          <div className="fc-event-title">{eventInfo.event.title}</div>
        </div>
        {provider && !isCancelled && (
          <div
            className="fc-event-provider-icon"
            dangerouslySetInnerHTML={{
              __html: `${provider.icon}<span>${provider.label}</span>`,
            }}
          />
        )}
      </div>
    );
  };

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    router.push(`/${siteLocale}/calendar/${calendarId}/event/${eventId}`);
  };

  const handleSelect = (info: any) => {
    if (!isOwner) return;

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
    <div className="rounded-xl border bg-card p-2 sm:p-4 fc-mobile-wrapper fc-calendar-card">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
        locales={[heLocale]}
        locale={locale}
        headerToolbar={isMobile
          ? { left: 'prev,next', center: 'title', right: 'today' }
          : { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }
        }
        events={fcEvents}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        selectable={isOwner}
        selectMirror={isOwner}
        select={handleSelect}
        windowResize={handleWindowResize}
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
