'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarEvent, EventFormData } from '@/types';
import { getEvent, updateEvent } from '@/lib/firestore/events';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EventForm } from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const eventId = params.eventId as string;
  const { calendar, loading: calLoading, isOwner } = useCalendar(calendarId);
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const ev = await getEvent(calendarId, eventId);
        setEvent(ev);
      } catch {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [calendarId, eventId]);

  if (loading || calLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Event not found</h2>
        <Button asChild>
          <Link href={`/en/calendar/${calendarId}`}>Back to Calendar</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (data: EventFormData) => {
    try {
      await updateEvent(calendarId, eventId, data);
      toast.success('Event updated!');
      router.push(`/en/calendar/${calendarId}/event/${eventId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
    }
  };

  const startTime = event.startTime?.toDate
    ? format(event.startTime.toDate(), "yyyy-MM-dd'T'HH:mm")
    : '';
  const endTime = event.endTime?.toDate
    ? format(event.endTime.toDate(), "yyyy-MM-dd'T'HH:mm")
    : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/en/calendar/${calendarId}/event/${eventId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Link>
      </Button>
      <EventForm
        initialData={{
          title: event.title,
          description: event.description,
          startTime,
          endTime,
          meetingLink: event.meetingLink,
        }}
        onSubmit={handleSubmit}
        isEditing
      />
    </div>
  );
}

export default function EditEventPage() {
  return (
    <AuthGuard>
      <EditEventContent />
    </AuthGuard>
  );
}
