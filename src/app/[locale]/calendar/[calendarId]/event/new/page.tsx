'use client';

import { useParams, useRouter } from 'next/navigation';
import { EventFormData } from '@/types';
import { createEvent } from '@/lib/firestore/events';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EventForm } from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function NewEventContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const { calendar, loading, isOwner } = useCalendar(calendarId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar || !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only the calendar owner can create events.</p>
      </div>
    );
  }

  const handleSubmit = async (data: EventFormData) => {
    try {
      await createEvent(calendarId, data);
      toast.success('Event created successfully!');
      router.push(`/en/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/en/calendar/${calendarId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Link>
      </Button>
      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function NewEventPage() {
  return (
    <AuthGuard>
      <NewEventContent />
    </AuthGuard>
  );
}
