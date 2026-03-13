'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from '@/types';
import { getCalendarByInviteCode, addMember } from '@/lib/firestore/calendars';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inviteCode = params.inviteCode as string;

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const cal = await getCalendarByInviteCode(inviteCode);
        if (cal) {
          setCalendar(cal);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching calendar:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, [inviteCode]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/en/auth/login`);
    }
  }, [user, authLoading, router]);

  const handleJoinWithoutPassword = async () => {
    if (!user || !calendar) return;
    setJoining(true);
    try {
      if (calendar.members.includes(user.uid)) {
        toast.success('You are already a member of this calendar!');
        router.push(`/en/calendar/${calendar.id}`);
        return;
      }
      await addMember(calendar.id, user.uid);
      toast.success('Successfully joined the calendar!');
      router.push(`/en/calendar/${calendar.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join calendar');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinWithPassword = async (data: PasswordFormData) => {
    if (!user || !calendar) return;
    setJoining(true);
    try {
      const verifyPassword = httpsCallable(functions, 'verifyCalendarPassword');
      const result = await verifyPassword({
        calendarId: calendar.id,
        password: data.password,
      });
      const response = result.data as { success: boolean };
      if (response.success) {
        toast.success('Successfully joined the calendar!');
        router.push(`/en/calendar/${calendar.id}`);
      } else {
        toast.error('Incorrect password. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify password');
    } finally {
      setJoining(false);
    }
  };

  // Auto-join if no password required
  useEffect(() => {
    if (calendar && user && !calendar.passwordHash && !joining) {
      handleJoinWithoutPassword();
    }
  }, [calendar, user]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Calendar Not Found</CardTitle>
            <CardDescription>
              This invite link may be invalid or expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/en/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!calendar?.passwordHash) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Joining calendar...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{calendar.title}</CardTitle>
          <CardDescription>
            This calendar is password-protected. Enter the password to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleJoinWithPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter the calendar password"
                {...register('password')}
                aria-label="Calendar password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={joining}>
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Calendar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
