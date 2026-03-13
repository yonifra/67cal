'use client';

import { useEffect, useState } from 'react';
import { Calendar } from '@/types';
import { getOwnedCalendars, getMemberCalendars, deleteCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function DashboardContent() {
  const [ownedCalendars, setOwnedCalendars] = useState<Calendar[]>([]);
  const [memberCalendars, setMemberCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchCalendars = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [owned, member] = await Promise.all([
        getOwnedCalendars(user.uid),
        getMemberCalendars(user.uid),
      ]);
      setOwnedCalendars(owned);
      // Filter out calendars that user owns from member list
      setMemberCalendars(member.filter((c) => c.ownerId !== user.uid));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [user]);

  const handleDelete = async (calendarId: string) => {
    if (!confirm('Are you sure you want to delete this calendar? This action cannot be undone.')) return;
    try {
      await deleteCalendar(calendarId);
      setOwnedCalendars((prev) => prev.filter((c) => c.id !== calendarId));
      toast.success('Calendar deleted');
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Calendars</h1>
          <p className="text-muted-foreground mt-1">Manage your class schedules</p>
        </div>
        <Button asChild>
          <Link href="/en/calendar/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Calendar
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="owned" className="space-y-6">
        <TabsList>
          <TabsTrigger value="owned">
            My Calendars ({ownedCalendars.length})
          </TabsTrigger>
          <TabsTrigger value="joined">
            Joined ({memberCalendars.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owned">
          {ownedCalendars.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ownedCalendars.map((cal) => (
                <CalendarCard
                  key={cal.id}
                  calendar={cal}
                  isOwner
                  onDelete={() => handleDelete(cal.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined">
          {memberCalendars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">No calendars joined yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ask your teacher for an invite link to join a calendar.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberCalendars.map((cal) => (
                <CalendarCard key={cal.id} calendar={cal} isOwner={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
