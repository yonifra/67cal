'use client';

import { useEffect, useState } from 'react';
import { Calendar } from '@/types';
import { getCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';

export function useCalendar(calendarId: string) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const isOwner = calendar?.ownerId === user?.uid;
  const isCollaborator = user?.uid ? (calendar?.collaborators ?? []).includes(user.uid) : false;
  const canEdit = isOwner || isCollaborator;
  const isMember = user?.uid ? calendar?.members?.includes(user.uid) ?? false : false;
  const role = isOwner || isCollaborator ? 'teacher' as const : 'pupil' as const;

  useEffect(() => {
    async function fetchCalendar() {
      try {
        setLoading(true);
        const cal = await getCalendar(calendarId);
        setCalendar(cal);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (calendarId) fetchCalendar();
  }, [calendarId]);

  return { calendar, loading, error, isOwner, isCollaborator, canEdit, isMember, role };
}
