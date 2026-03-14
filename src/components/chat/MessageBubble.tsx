'use client';

import { Message } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isTeacher: boolean;
  canDelete: boolean;
  onDelete: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  isTeacher,
  canDelete,
  onDelete,
}: MessageBubbleProps) {
  const t = useTranslations('chat');
  const isTeacherMessage = message.authorRole === 'teacher';
  const timestamp = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), 'HH:mm')
    : '';

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        isTeacherMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isTeacherMessage && (
        <div className="flex-shrink-0 mt-1">
          <UserAvatar
            displayName={message.authorName}
            avatarStyle={message.authorAvatarStyle}
            avatarSeed={message.authorAvatarSeed}
            size="sm"
          />
        </div>
      )}
      <div
        className={cn(
          'group relative max-w-[75%] rounded-sm px-4 py-2',
          isTeacherMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              'text-xs font-semibold',
              isTeacherMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {message.authorName}
          </span>
          {isTeacherMessage && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-sm',
                isTeacherMessage
                  ? 'bg-primary-foreground/20 text-primary-foreground/80'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {t('teacherRole')}
            </span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center justify-between mt-1 gap-2">
          <span
            className={cn(
              'text-[10px]',
              isTeacherMessage ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}
          >
            {timestamp}
          </span>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity',
                isTeacherMessage
                  ? 'hover:bg-primary-foreground/20 text-primary-foreground/60'
                  : 'hover:bg-muted-foreground/20 text-muted-foreground'
              )}
              onClick={() => onDelete(message.id)}
              aria-label={t('deleteMessage')}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {isTeacherMessage && (
        <div className="flex-shrink-0 mt-1">
          <UserAvatar
            displayName={message.authorName}
            avatarStyle={message.authorAvatarStyle}
            avatarSeed={message.authorAvatarSeed}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
