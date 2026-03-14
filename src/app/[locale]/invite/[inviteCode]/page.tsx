'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from '@/types';
import { getCalendarByInviteCode, getCalendarByCollaboratorInviteCode, addCollaborator } from '@/lib/firestore/calendars';
import { getUserProfile } from '@/lib/firestore/users';
import { useAuth } from '@/hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, AlertCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

type PasswordFormData = { password: string };

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isCollaboratorInvite, setIsCollaboratorInvite] = useState(false);
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null);
  const inviteCode = params.inviteCode as string;
  const t = useTranslations('invite');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const passwordSchema = z.object({
    password: z.string().min(1, t('passwordFieldRequired')),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    async function fetchCalendar() {
      try {
        // First try pupil invite code
        let cal = await getCalendarByInviteCode(inviteCode);
        if (cal) {
          setCalendar(cal);
          setIsCollaboratorInvite(false);
        } else {
          // Try collaborator invite code
          cal = await getCalendarByCollaboratorInviteCode(inviteCode);
          if (cal) {
            setCalendar(cal);
            setIsCollaboratorInvite(true);
          } else {
            setNotFound(true);
          }
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
      router.push(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  // Validate collaborator eligibility
  useEffect(() => {
    async function validateCollaborator() {
      if (!isCollaboratorInvite || !user || !calendar) return;

      // Check if user is already the owner
      if (calendar.ownerId === user.uid) {
        setCollaboratorError('alreadyOwner');
        return;
      }

      // Check if user is already a collaborator
      if ((calendar.collaborators ?? []).includes(user.uid)) {
        setCollaboratorError('alreadyCollaborator');
        return;
      }

      // Check if user is a teacher
      const profile = await getUserProfile(user.uid);
      if (!profile || profile.role !== 'teacher') {
        setCollaboratorError('teacherOnlyError');
        return;
      }

      setCollaboratorError(null);
    }
    validateCollaborator();
  }, [isCollaboratorInvite, user, calendar]);

  const handleJoinWithoutPassword = async () => {
    if (!user || !calendar) return;
    setJoining(true);
    try {
      if (calendar.members.includes(user.uid)) {
        toast.success(t('alreadyMember'));
        router.push(`/${locale}/calendar/${calendar.id}`);
        return;
      }
      const joinCalendar = httpsCallable(functions, 'joinCalendar');
      const result = await joinCalendar({
        calendarId: calendar.id,
        inviteCode,
      });
      const response = result.data as { success: boolean };
      if (response.success) {
        toast.success(t('joinSuccess'));
        router.push(`/${locale}/calendar/${calendar.id}`);
      } else {
        toast.error(t('joinFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('joinFailed'));
    } finally {
      setJoining(false);
    }
  };

  const handleJoinAsCollaborator = async () => {
    if (!user || !calendar) return;
    setJoining(true);
    try {
      await addCollaborator(calendar.id, user.uid);
      toast.success(t('collaboratorJoinSuccess'));
      router.push(`/${locale}/calendar/${calendar.id}`);
    } catch (error: any) {
      toast.error(error.message || t('joinFailed'));
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
        toast.success(t('joinSuccess'));
        router.push(`/${locale}/calendar/${calendar.id}`);
      } else {
        toast.error(t('invalidPassword'));
      }
    } catch (error: any) {
      toast.error(error.message || t('joinFailed'));
    } finally {
      setJoining(false);
    }
  };

  // Auto-join if no password required (pupil invite only)
  useEffect(() => {
    if (calendar && user && !isCollaboratorInvite && !calendar.passwordHash && !joining) {
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
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-sm bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t('notFound')}</CardTitle>
            <CardDescription>
              {t('notFoundDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/${locale}/dashboard`}>{tCommon('goToDashboard')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Collaborator invite flow
  if (isCollaboratorInvite && calendar) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t('collaboratorInviteTitle')}</CardTitle>
            <CardDescription>
              {t('collaboratorInviteDesc')} <strong>{calendar.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collaboratorError ? (
              <div className="rounded-sm bg-destructive/10 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive">{t(collaboratorError)}</p>
                <Button asChild className="mt-4">
                  <Link href={`/${locale}/dashboard`}>{tCommon('goToDashboard')}</Link>
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleJoinAsCollaborator}
                disabled={joining}
              >
                {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('joinAsCollaborator')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!calendar?.passwordHash) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t('joining')}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{calendar.title}</CardTitle>
          <CardDescription>
            {t('passwordRequired')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleJoinWithPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{tAuth('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                {...register('password')}
                aria-label={t('passwordPlaceholder')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={joining}>
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('join')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
