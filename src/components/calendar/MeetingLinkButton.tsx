'use client';

import { CalendarEvent, MeetingProvider } from '@/types';
import { getMeetingProviderLabel } from '@/lib/meetingProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Monitor, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface MeetingLinkButtonProps {
  meetingLink: string;
  provider: MeetingProvider;
}

function getProviderIcon(provider: MeetingProvider) {
  switch (provider) {
    case 'zoom':
      return <Video className="h-4 w-4" />;
    case 'meet':
      return <Video className="h-4 w-4" />;
    case 'teams':
      return <Monitor className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
}

const providerColors: Record<MeetingProvider, string> = {
  zoom: 'bg-blue-600 hover:bg-blue-700 text-white',
  meet: 'bg-green-600 hover:bg-green-700 text-white',
  teams: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  other: 'bg-primary hover:bg-primary/90 text-primary-foreground',
};

export function MeetingLinkButton({ meetingLink, provider }: MeetingLinkButtonProps) {
  const t = useTranslations('event');

  if (!meetingLink) return null;

  return (
    <Button
      className={cn('gap-2', providerColors[provider])}
      onClick={() => window.open(meetingLink, '_blank')}
      aria-label={`${t('joinMeeting')} ${getMeetingProviderLabel(provider)}`}
    >
      {getProviderIcon(provider)}
      {t('joinMeeting')}
    </Button>
  );
}
