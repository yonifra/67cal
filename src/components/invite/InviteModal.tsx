'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ShareLinkButton } from './ShareLinkButton';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface InviteModalProps {
  inviteCode: string;
  calendarTitle: string;
}

export function InviteModal({ inviteCode, calendarTitle }: InviteModalProps) {
  const t = useTranslations('invite');
  const tc = useTranslations('calendar');
  const locale = useLocale();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/${locale}/invite/${inviteCode}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          {tc('invite')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('shareLink')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('shareLinkLabel')}</label>
            <ShareLinkButton url={inviteUrl} />
          </div>
          <Separator />
          <div className="flex justify-center">
            <QRCodeDisplay url={inviteUrl} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
