import ical, { ICalCalendarMethod } from 'ical-generator';
import { CalendarEvent } from '@/types';

export function generateICS(event: CalendarEvent, calendarTitle?: string): string {
  const calendar = ical({
    name: calendarTitle || '67Cal Event',
    method: ICalCalendarMethod.PUBLISH,
  });

  const startDate = event.startTime.toDate();
  const endDate = event.endTime.toDate();

  calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: event.title,
    description: event.description,
    url: event.meetingLink || undefined,
    location: event.meetingLink || undefined,
    status: event.status === 'cancelled' ? 'CANCELLED' as any : 'CONFIRMED' as any,
  });

  return calendar.toString();
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = event.startTime.toDate();
  const endDate = event.endTime.toDate();

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description || '',
    location: event.meetingLink || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
