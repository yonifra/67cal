'use client';

import { useEffect, useState } from 'react';
import { Calendar } from '@/types';
import { getOwnedCalendars } from '@/lib/firestore/calendars';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    getOwnedCalendars(user.uid).then(setCalendars).catch(console.error);
  }, [user]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Calendars
          </h2>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1 p-2">
          {calendars.map((cal) => (
            <Link
              key={cal.id}
              href={`/en/calendar/${cal.id}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{cal.title}</span>
            </Link>
          ))}
          {calendars.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No calendars yet
            </p>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <Button asChild className="w-full" size="sm">
            <Link href="/en/calendar/new">
              <Plus className="mr-2 h-4 w-4" />
              New Calendar
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
