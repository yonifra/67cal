'use client';

import { useEffect, useState } from 'react';
import { Calendar, UserProfile } from '@/types';
import { removeCollaborator, regenerateCollaboratorInviteCode } from '@/lib/firestore/calendars';
import { getUserProfiles } from '@/lib/firestore/users';
import { ShareLinkButton } from '@/components/invite/ShareLinkButton';
import { QRCodeDisplay } from '@/components/invite/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, X, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface CollaboratorManagerProps {
  calendar: Calendar;
  onUpdate: () => void;
}

export function CollaboratorManager({ calendar, onUpdate }: CollaboratorManagerProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState(calendar.collaboratorInviteCode);
  const t = useTranslations('calendar');
  const locale = useLocale();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/${locale}/invite/${inviteCode}`;

  const collaboratorUids = calendar.collaborators ?? [];

  useEffect(() => {
    async function fetchProfiles() {
      if (collaboratorUids.length === 0) {
        setProfiles([]);
        return;
      }
      setLoading(true);
      try {
        const result = await getUserProfiles(collaboratorUids);
        setProfiles(result);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [collaboratorUids.join(',')]);

  const handleRegenerate = async () => {
    if (!confirm(t('regenerateConfirm'))) return;
    setRegenerating(true);
    try {
      const newCode = await regenerateCollaboratorInviteCode(calendar.id);
      setInviteCode(newCode);
      toast.success(t('codeRegenerated'));
    } catch {
      toast.error(t('collaboratorRemoveFailed'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleRemove = async (profile: UserProfile) => {
    if (!confirm(t('removeCollaboratorConfirm', { name: profile.displayName }))) return;
    setRemovingId(profile.uid);
    try {
      await removeCollaborator(calendar.id, profile.uid);
      setProfiles((prev) => prev.filter((p) => p.uid !== profile.uid));
      toast.success(t('collaboratorRemoved'));
      onUpdate();
    } catch {
      toast.error(t('collaboratorRemoveFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('collaborators')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('collaboratorsDesc')}
        </p>
      </div>

      {/* Invite Link Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('collaboratorInviteLink')}</label>
        <p className="text-xs text-muted-foreground">{t('collaboratorInviteLinkDesc')}</p>
        <ShareLinkButton url={inviteUrl} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {t('regenerateCode')}
          </Button>
        </div>

        <Separator />

        <div className="flex justify-center">
          <QRCodeDisplay url={inviteUrl} size={160} />
        </div>
      </div>

      <Separator />

      {/* Current Collaborators List */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('collaborators')}</label>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-sm border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">{t('noCollaborators')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('noCollaboratorsDesc')}</p>
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
                  onClick={() => handleRemove(profile)}
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
    </div>
  );
}
