'use client';

import { useRouter } from 'next/navigation';
import { CalendarX, CalendarClock, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { AppNotification } from '@/stores/notificationStore';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const dateFnsLocale = locale === 'he' ? he : enUS;

  const handleClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    router.push(`/${locale}/calendar/${notification.calendarId}/event/${notification.eventId}`);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">{t('title')}</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={`flex items-start gap-3 px-4 py-3 text-start hover:bg-accent/50 transition-colors border-b last:border-b-0 ${
                  !notification.read ? 'bg-accent/30' : ''
                }`}
              >
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {notification.type === 'event_cancelled' ? (
                    <CalendarX className="h-5 w-5 text-destructive" />
                  ) : (
                    <CalendarClock className="h-5 w-5 text-amber-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {notification.type === 'event_cancelled'
                      ? t('eventCancelled', { event: notification.eventTitle })
                      : t('eventTimeChanged', { event: notification.eventTitle })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('byActor', {
                      actor: notification.actorName,
                      calendar: notification.calendarTitle,
                    })}
                  </p>
                  {notification.createdAt && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(
                        notification.createdAt.toDate ? notification.createdAt.toDate() : new Date(),
                        { addSuffix: true, locale: dateFnsLocale }
                      )}
                    </p>
                  )}
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div className="mt-2 flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
