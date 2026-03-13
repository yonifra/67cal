'use client';

import { useRouter } from 'next/navigation';
import { CalendarFormData } from '@/types';
import { createCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarForm } from '@/components/calendar/CalendarForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function NewCalendarContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleSubmit = async (data: CalendarFormData) => {
    if (!user) return;
    try {
      const calendarId = await createCalendar(user.uid, data);
      toast.success('Calendar created successfully!');
      router.push(`/en/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create calendar');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/en/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <CalendarForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function NewCalendarPage() {
  return (
    <AuthGuard>
      <NewCalendarContent />
    </AuthGuard>
  );
}
