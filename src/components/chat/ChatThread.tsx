'use client';

import { useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuthStore } from '@/stores/authStore';
import { sendMessage, deleteMessage } from '@/lib/firestore/messages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { AuthorRole, Message } from '@/types';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface ChatThreadProps {
  calendarId: string;
  eventId: string;
  isOwner: boolean;
}

function groupMessagesByDate(
  messages: Message[],
  todayLabel: string,
  yesterdayLabel: string
): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  for (const msg of messages) {
    const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
    let label: string;
    if (isToday(date)) label = todayLabel;
    else if (isYesterday(date)) label = yesterdayLabel;
    else label = format(date, 'MMMM d, yyyy');

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(msg);
  }
  return groups;
}

export function ChatThread({ calendarId, eventId, isOwner }: ChatThreadProps) {
  const t = useTranslations('chat');
  const { messages, loading } = useMessages(calendarId, eventId);
  const user = useAuthStore((s) => s.user);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!user) return;
    try {
      await sendMessage(calendarId, eventId, {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorRole: isOwner ? 'teacher' : 'pupil',
        text,
      });
    } catch (error: any) {
      toast.error(t('sendFailed'));
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(calendarId, eventId, messageId);
      toast.success(t('messageDeleted'));
    } catch {
      toast.error(t('deleteFailed'));
    }
  };

  const grouped = groupMessagesByDate(messages, t('today'), t('yesterday'));

  return (
    <div className="flex h-[500px] flex-col rounded-sm border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <span className="text-xs text-muted-foreground">({messages.length})</span>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('noMessages')}</p>
            <p className="text-xs text-muted-foreground">{t('noMessagesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateLabel, msgs]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-2 my-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground px-2">{dateLabel}</span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  {msgs.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.authorId === user?.uid}
                      isTeacher={isOwner}
                      canDelete={isOwner || msg.authorId === user?.uid}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <MessageInput onSend={handleSend} />
    </div>
  );
}
