'use client';

import { CalendarEvent, MeetingProvider } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Video, Monitor, MessageSquare, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

function getProviderIcon(provider: MeetingProvider) {
  switch (provider) {
    case 'zoom':
      return <Video className="h-3 w-3" />;
    case 'meet':
      return <Video className="h-3 w-3" />;
    case 'teams':
      return <Monitor className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isCancelled = event.status === 'cancelled';
  const startTime = event.startTime?.toDate ? format(event.startTime.toDate(), 'HH:mm') : '';
  const endTime = event.endTime?.toDate ? format(event.endTime.toDate(), 'HH:mm') : '';

  return (
    <div
      className={cn(
        'cursor-pointer rounded-md p-2 text-xs transition-colors',
        isCancelled
          ? 'bg-muted/50 text-muted-foreground'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className={cn('font-semibold truncate', isCancelled && 'line-through')}>
          {event.title}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] opacity-80">
        <span>
          {startTime} - {endTime}
        </span>
        {event.meetingProvider && event.meetingProvider !== 'other' && (
          <span className="flex items-center gap-0.5">
            {getProviderIcon(event.meetingProvider)}
          </span>
        )}
        {isCancelled && (
          <Badge variant="destructive" className="h-4 text-[9px] px-1">
            <Ban className="h-2 w-2 mr-0.5" />
            Cancelled
          </Badge>
        )}
      </div>
    </div>
  );
}
