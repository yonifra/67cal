'use client';

import { CalendarEvent } from '@/types';
import { generateGoogleCalendarUrl } from '@/lib/ical';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, ExternalLink, Share2 } from 'lucide-react';

interface ExportButtonProps {
  event: CalendarEvent;
}

export function ExportButton({ event }: ExportButtonProps) {
  const handleGoogleExport = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  const handleICSDownload = () => {
    window.open(`/api/export/${event.id}`, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleExport}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleICSDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
