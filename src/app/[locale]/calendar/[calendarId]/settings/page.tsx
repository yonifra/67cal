'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarFormData, Calendar } from '@/types';
import { getCalendar, updateCalendar, deleteCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarForm } from '@/components/calendar/CalendarForm';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function SettingsContent() {
  const params = useParams();
  const router = useRouter();
  const calendarId = params.calendarId as string;
  const user = useAuthStore((s) => s.user);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const cal = await getCalendar(calendarId);
        if (cal && cal.ownerId === user?.uid) {
          setCalendar(cal);
        } else {
          toast.error('Calendar not found or access denied');
          router.push('/en/dashboard');
        }
      } catch {
        toast.error('Failed to load calendar');
      } finally {
        setLoading(false);
      }
    }
    if (user) fetch();
  }, [calendarId, user, router]);

  const handleSubmit = async (data: CalendarFormData) => {
    try {
      await updateCalendar(calendarId, data);
      toast.success('Calendar updated successfully!');
      router.push(`/en/calendar/${calendarId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update calendar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this calendar? This action cannot be undone.')) return;
    try {
      await deleteCalendar(calendarId);
      toast.success('Calendar deleted');
      router.push('/en/dashboard');
    } catch {
      toast.error('Failed to delete calendar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!calendar) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/en/calendar/${calendarId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Link>
      </Button>

      <CalendarForm
        initialData={{
          title: calendar.title,
          description: calendar.description,
          theme: calendar.theme,
          language: calendar.language,
        }}
        onSubmit={handleSubmit}
        isEditing
      />

      <Separator className="my-8" />

      <div className="rounded-lg border border-destructive/50 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting this calendar will permanently remove all events, messages, and files.
        </p>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Calendar
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
