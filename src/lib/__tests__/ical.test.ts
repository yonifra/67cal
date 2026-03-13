import { describe, it, expect } from 'vitest';
import { generateICS, generateGoogleCalendarUrl } from '../ical';
import type { CalendarEvent } from '@/types';

// Helper to create a mock CalendarEvent with Timestamp-like objects
function createMockEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const startDate = new Date('2025-06-15T10:00:00Z');
  const endDate = new Date('2025-06-15T11:00:00Z');

  return {
    id: 'event-1',
    title: 'Test Event',
    description: 'A test event description',
    startTime: { toDate: () => startDate } as any,
    endTime: { toDate: () => endDate } as any,
    meetingLink: 'https://zoom.us/j/123456',
    meetingProvider: 'zoom',
    status: 'active',
    cancelReason: null,
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
    ...overrides,
  };
}

describe('generateICS()', () => {
  it('returns a valid ICS string', () => {
    const event = createMockEvent();
    const ics = generateICS(event);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('includes the event title as SUMMARY', () => {
    const event = createMockEvent({ title: 'My Special Event' });
    const ics = generateICS(event);
    expect(ics).toContain('My Special Event');
  });

  it('includes the event description', () => {
    const event = createMockEvent({ description: 'Important details here' });
    const ics = generateICS(event);
    expect(ics).toContain('Important details here');
  });

  it('uses custom calendar title when provided', () => {
    const event = createMockEvent();
    const ics = generateICS(event, 'My Calendar');
    expect(ics).toContain('My Calendar');
  });

  it('uses default calendar title when not provided', () => {
    const event = createMockEvent();
    const ics = generateICS(event);
    expect(ics).toContain('67Cal Event');
  });

  it('sets CANCELLED status for cancelled events', () => {
    const event = createMockEvent({ status: 'cancelled' });
    const ics = generateICS(event);
    expect(ics).toContain('CANCELLED');
  });

  it('sets CONFIRMED status for active events', () => {
    const event = createMockEvent({ status: 'active' });
    const ics = generateICS(event);
    expect(ics).toContain('CONFIRMED');
  });

  it('includes meeting link as URL', () => {
    const event = createMockEvent({ meetingLink: 'https://meet.google.com/abc' });
    const ics = generateICS(event);
    expect(ics).toContain('https://meet.google.com/abc');
  });
});

describe('generateGoogleCalendarUrl()', () => {
  it('returns a Google Calendar URL', () => {
    const event = createMockEvent();
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain('https://calendar.google.com/calendar/render');
  });

  it('includes action=TEMPLATE parameter', () => {
    const event = createMockEvent();
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain('action=TEMPLATE');
  });

  it('includes the event title', () => {
    const event = createMockEvent({ title: 'Math Lesson' });
    const url = generateGoogleCalendarUrl(event);
    expect(url).toContain('Math+Lesson');
  });

  it('includes formatted dates', () => {
    const event = createMockEvent();
    const url = generateGoogleCalendarUrl(event);
    // Dates should be in the format YYYYMMDDTHHmmssZ (no dashes/colons/milliseconds)
    expect(url).toContain('dates=');
    // The date format should not contain dashes or colons
    const datesParam = new URL(url).searchParams.get('dates');
    expect(datesParam).toBeTruthy();
    expect(datesParam).not.toContain('-');
    expect(datesParam).not.toContain(':');
    expect(datesParam).toContain('/'); // separator between start and end
  });

  it('includes description in details param', () => {
    const event = createMockEvent({ description: 'Test description' });
    const url = generateGoogleCalendarUrl(event);
    const details = new URL(url).searchParams.get('details');
    expect(details).toBe('Test description');
  });

  it('includes meeting link as location', () => {
    const event = createMockEvent({ meetingLink: 'https://zoom.us/j/999' });
    const url = generateGoogleCalendarUrl(event);
    const location = new URL(url).searchParams.get('location');
    expect(location).toBe('https://zoom.us/j/999');
  });

  it('handles empty description gracefully', () => {
    const event = createMockEvent({ description: '' });
    const url = generateGoogleCalendarUrl(event);
    const details = new URL(url).searchParams.get('details');
    expect(details).toBe('');
  });

  it('handles empty meeting link gracefully', () => {
    const event = createMockEvent({ meetingLink: '' });
    const url = generateGoogleCalendarUrl(event);
    const location = new URL(url).searchParams.get('location');
    expect(location).toBe('');
  });
});
