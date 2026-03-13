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

interface InviteModalProps {
  inviteCode: string;
  calendarTitle: string;
}

export function InviteModal({ inviteCode, calendarTitle }: InviteModalProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/en/invite/${inviteCode}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Pupils
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Pupils</DialogTitle>
          <DialogDescription>
            Share this link or QR code with your pupils to join &quot;{calendarTitle}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
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
