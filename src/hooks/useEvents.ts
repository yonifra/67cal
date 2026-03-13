'use client';

import { useEffect, useState } from 'react';
import { CalendarEvent } from '@/types';
import { subscribeToEvents } from '@/lib/firestore/events';

export function useEvents(calendarId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!calendarId) return;
    setLoading(true);
    const unsubscribe = subscribeToEvents(calendarId, (events) => {
      setEvents(events);
      setLoading(false);
    });
    return unsubscribe;
  }, [calendarId]);

  return { events, loading };
}
