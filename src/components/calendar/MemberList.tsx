'use client';

import { useEffect, useState } from 'react';
import { Calendar, UserProfile } from '@/types';
import { removeMember } from '@/lib/firestore/calendars';
import { getUserProfiles } from '@/lib/firestore/users';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader2, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface MemberListProps {
  calendar: Calendar;
  onUpdate: () => void;
}

export function MemberList({ calendar, onUpdate }: MemberListProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<UserProfile | null>(null);
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');

  // Pupils = members who are neither the owner nor collaborators
  const collaboratorSet = new Set(calendar.collaborators ?? []);
  const pupilUids = (calendar.members ?? []).filter(
    (uid) => uid !== calendar.ownerId && !collaboratorSet.has(uid)
  );

  useEffect(() => {
    async function fetchProfiles() {
      if (pupilUids.length === 0) {
        setProfiles([]);
        return;
      }
      setLoading(true);
      try {
        const result = await getUserProfiles(pupilUids);
        setProfiles(result);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [pupilUids.join(',')]);

  const handleRemove = async (profile: UserProfile) => {
    setRemovingId(profile.uid);
    try {
      await removeMember(calendar.id, profile.uid);
      setProfiles((prev) => prev.filter((p) => p.uid !== profile.uid));
      toast.success(t('pupilRemoved'));
      onUpdate();
    } catch {
      toast.error(t('pupilRemoveFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {t('pupils')}
          {!loading && profiles.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({profiles.length})
            </span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('pupilsDesc')}
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-sm border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">{t('noPupils')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('noPupilsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.uid}
                className="flex items-center justify-between rounded-sm border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemoveTarget(profile)}
                  disabled={removingId === profile.uid}
                >
                  {removingId === profile.uid ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title={t('removePupil')}
        description={removeTarget ? t('removePupilConfirm', { name: removeTarget.displayName }) : ''}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        onConfirm={() => { if (removeTarget) handleRemove(removeTarget); }}
      />
    </div>
  );
}
