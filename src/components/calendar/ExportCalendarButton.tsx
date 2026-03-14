'use client';

import { CalendarEvent } from '@/types';
import { generateGoogleCalendarUrl } from '@/lib/ical';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, ExternalLink, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ExportCalendarButtonProps {
  calendarId: string;
  calendarTitle: string;
  events: CalendarEvent[];
}

export function ExportCalendarButton({ calendarId, calendarTitle, events }: ExportCalendarButtonProps) {
  const t = useTranslations('calendar');

  const activeEvents = events.filter((e) => e.status !== 'cancelled');

  const handleGoogleExport = () => {
    // Google Calendar doesn't support bulk import via URL,
    // so we open each event individually in new tabs (up to a reasonable limit)
    const eventsToExport = activeEvents.slice(0, 20);
    for (const event of eventsToExport) {
      const url = generateGoogleCalendarUrl(event);
      window.open(url, '_blank');
    }
  };

  const handleICSDownload = () => {
    window.open(`/api/export/calendar/${calendarId}`, '_blank');
  };

  if (activeEvents.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('exportCalendar')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('exportCalendarDesc', { count: activeEvents.length })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGoogleExport}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {t('exportAllGoogle')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleICSDownload}>
          <Download className="mr-2 h-4 w-4" />
          {t('exportAllICS')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
