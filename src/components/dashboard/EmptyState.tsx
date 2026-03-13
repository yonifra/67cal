'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export function EmptyState() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-2">{t('noCalendars')}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
        {t('noCalendarsDesc')}
      </p>
      <Button asChild>
        <Link href={`/${locale}/calendar/new`}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createCalendar')}
        </Link>
      </Button>
    </div>
  );
}
