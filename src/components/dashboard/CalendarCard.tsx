'use client';

import { Calendar } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteModal } from '@/components/invite/InviteModal';
import { Calendar as CalendarIcon, Users, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface CalendarCardProps {
  calendar: Calendar;
  isOwner: boolean;
  onDelete?: () => void;
}

const themeColors: Record<string, string> = {
  kids: 'bg-pink-500 text-white border-pink-500',
  teen: 'bg-purple-500 text-white border-purple-500',
  adult: 'bg-blue-500 text-white border-blue-500',
  minimal: 'bg-gray-500 text-white border-gray-500',
};

export function CalendarCard({ calendar, isOwner, onDelete }: CalendarCardProps) {
  const td = useTranslations('dashboard');
  const tn = useTranslations('nav');
  const locale = useLocale();

  const createdDate = calendar.createdAt?.toDate
    ? format(calendar.createdAt.toDate(), 'MMM d, yyyy')
    : '';

  return (
    <Card className="group hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              <Link
                href={`/${locale}/calendar/${calendar.id}`}
                className="hover:underline"
              >
                {calendar.title}
              </Link>
            </CardTitle>
          </div>
          <Badge variant="outline" className={themeColors[calendar.theme] || ''}>
            {calendar.theme}
          </Badge>
        </div>
        {calendar.description && (
          <CardDescription className="line-clamp-2">
            {calendar.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {td('members', { count: calendar.members?.length || 0 })}
          </span>
          {createdDate && <span>{td('createdOn', { date: createdDate })}</span>}
        </div>
      </CardContent>
      {isOwner && (
        <CardFooter className="flex items-center gap-2">
          <InviteModal inviteCode={calendar.inviteCode} calendarTitle={calendar.title} />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/calendar/${calendar.id}/settings`}>
              <Settings className="mr-1 h-3.5 w-3.5" />
              {tn('settings')}
            </Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
