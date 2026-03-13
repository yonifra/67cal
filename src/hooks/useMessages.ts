'use client';

import { useEffect, useState } from 'react';
import { Message } from '@/types';
import { subscribeToMessages } from '@/lib/firestore/messages';

export function useMessages(calendarId: string, eventId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!calendarId || !eventId) return;
    setLoading(true);
    const unsubscribe = subscribeToMessages(calendarId, eventId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsubscribe;
  }, [calendarId, eventId]);

  return { messages, loading };
}
