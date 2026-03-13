'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-2">No calendars yet</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
        Create your first calendar to get started with scheduling classes for your pupils.
      </p>
      <Button asChild>
        <Link href="/en/calendar/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Calendar
        </Link>
      </Button>
    </div>
  );
}
