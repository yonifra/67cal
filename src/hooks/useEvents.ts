'use client';

import { useEffect, useState } from 'react';
import { CalendarEvent } from '@/types';
import { subscribeToEvents } from '@/lib/firestore/events';

export function useEvents(calendarId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!calendarId) return;
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToEvents(
      calendarId,
      (events) => {
        setEvents(events);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [calendarId]);

  return { events, loading, error };
}
