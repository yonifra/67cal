'use client';

import { useEffect, useState } from 'react';
import { Calendar } from '@/types';
import { getOwnedCalendars, getMemberCalendars, getCollaboratorCalendars, deleteCalendar } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

function DashboardContent() {
  const [ownedCalendars, setOwnedCalendars] = useState<Calendar[]>([]);
  const [memberCalendars, setMemberCalendars] = useState<Calendar[]>([]);
  const [collaboratingCalendars, setCollaboratingCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const t = useTranslations('dashboard');
  const ta = useTranslations('auth');
  const tCal = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isTeacher = role === 'teacher';

  const fetchCalendars = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [owned, member, collaborating] = await Promise.all([
        isTeacher ? getOwnedCalendars(user.uid) : Promise.resolve([]),
        getMemberCalendars(user.uid),
        isTeacher ? getCollaboratorCalendars(user.uid) : Promise.resolve([]),
      ]);
      setOwnedCalendars(owned);

      // Get collaborator IDs to filter them out of joined tab
      const collaboratorIds = new Set(collaborating.map((c) => c.id));

      // Filter out calendars that user owns or is a collaborator on from member list
      setMemberCalendars(
        member.filter((c) => c.ownerId !== user.uid && !collaboratorIds.has(c.id))
      );
      setCollaboratingCalendars(collaborating);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [user]);

  const handleDelete = async (calendarId: string) => {
    try {
      await deleteCalendar(calendarId);
      setOwnedCalendars((prev) => prev.filter((c) => c.id !== calendarId));
      toast.success(t('calendarDeleted'));
    } catch {
      toast.error(t('deleteFailed'));
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
          <h1 className="font-heading text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isTeacher ? t('subtitle') : ta('pupilDashboardSubtitle')}
          </p>
        </div>
        {isTeacher && (
          <Button asChild>
            <Link href={`/${locale}/calendar/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createCalendar')}
            </Link>
          </Button>
        )}
      </div>

      {isTeacher ? (
        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList>
            <TabsTrigger value="owned">
              {t('ownedTab')} ({ownedCalendars.length})
            </TabsTrigger>
            <TabsTrigger value="collaborating">
              {t('collaboratingTab')} ({collaboratingCalendars.length})
            </TabsTrigger>
            <TabsTrigger value="joined">
              {t('joinedTab')} ({memberCalendars.length})
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
                    onDelete={() => setDeleteTarget(cal.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaborating">
            {collaboratingCalendars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">{t('noCollaboratingCalendars')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('noCollaboratingCalendarsDesc')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collaboratingCalendars.map((cal) => (
                  <CalendarCard
                    key={cal.id}
                    calendar={cal}
                    isOwner={false}
                    isCollaborator
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="joined">
            {memberCalendars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">{t('noJoinedCalendars')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('noJoinedCalendarsDesc')}
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
      ) : (
        /* Pupil view: only joined calendars, no tabs */
        <div>
          {memberCalendars.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-16 text-center">
              <p className="text-muted-foreground">{t('noJoinedCalendars')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {ta('pupilNoCalendarsDesc')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberCalendars.map((cal) => (
                <CalendarCard key={cal.id} calendar={cal} isOwner={false} />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={tCal('delete')}
        description={t('deleteConfirmMsg')}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
      />
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
